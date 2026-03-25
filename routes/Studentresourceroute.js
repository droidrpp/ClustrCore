
const express      = require('express');
const router       = express.Router();
const Resource     = require('../models/Resource');
const User         = require('../models/User');
const Registration = require('../models/Registration');

/* ── MIDDLEWARE: logged-in students only ─────────────────────── */
async function requireStudent(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ message: 'Not authenticated.' });
  try {
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'student')
      return res.status(403).json({ message: 'Student access only.' });
    req.currentUser = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid session.' });
  }
}

/* ── GET /api/student/resources ──────────────────────────────── */
// Returns all resources (sent to 'all' OR to an event the student
// registered for). For now returns all — filter by sentTo if needed.
//
// Query params:
//   ?search=keyword        — filter by subject or fileName
//   ?type=pdf|video|doc    — filter by mimeType group
//   ?page=1&limit=20
//
router.get('/resources', requireStudent, async (req, res) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;

    // Get events the student registered for
    const registrations = await Registration.find({ email: req.currentUser.email }).select('eventId');
    const eventIds = registrations.map(r => r.eventId);

    const filter = {};

    // Only show resources for registered events
    if (eventIds.length > 0) {
      filter.event = { $in: eventIds };
    } else {
      return res.json({ resources: [], total: 0, page: Number(page), pages: 0 });
    }

    // Text search on subject or fileName
    if (search) {
      filter.$or = [
        { subject:      { $regex: search, $options: 'i' } },
        { fileName:     { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { message:      { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by file type group
    if (type === 'pdf') {
      filter.mimeType = 'application/pdf';
    } else if (type === 'video') {
      filter.mimeType = { $regex: 'video', $options: 'i' };
    } else if (type === 'doc') {
      filter.mimeType = {
        $in: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
      };
    } else if (type === 'image') {
      filter.mimeType = { $regex: '^image/', $options: 'i' };
    }

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('sentBy', 'name team')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Resource.countDocuments(filter),
    ]);

    // Shape response — never expose raw buffer/binary data
    const shaped = resources.map(r => ({
      _id:            r._id,
      subject:        r.subject,
      message:        r.message || '',
      fileName:       r.originalName,
      mimeType:       r.mimeType,
      fileSize:       r.size,
      sentBy:         r.sentBy?.name || 'Digital Team',
      createdAt:      r.createdAt,
    }));

    res.json({ resources: shaped, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── DOWNLOAD RESOURCE ───────────────────────── */
router.get('/resources/:resourceId/download', requireStudent, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    // Check if student is registered for the event
    const registration = await Registration.findOne({ email: req.currentUser.email, eventId: resource.event });
    if (!registration) return res.status(403).json({ message: 'Access denied.' });

    // Send the file
    const buffer = Buffer.from(resource.fileData, 'base64');
    res.set({
      'Content-Type': resource.mimeType,
      'Content-Disposition': `attachment; filename="${resource.originalName}"`,
    });
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;