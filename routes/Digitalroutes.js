const express      = require('express');
const router       = express.Router();
const mongoose     = require('mongoose');
const multer       = require('multer');

const User         = require('../models/User');
const Event        = require('../models/Event');
const Registration = require('../models/Registration');
const Announcement = require('../models/Announcement');
const Resource     = require('../models/Resource');
const Report       = require('../models/Report');
const Merch        = require('../models/Merch');

/* ══════════════════════════════════════════════════════════
   MIDDLEWARE: Digital team only
══════════════════════════════════════════════════════════ */
async function requireDigital(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ message: 'Not authenticated.' });
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ message: 'Invalid user ID format.' });
  }
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found.' });
    if (user.role !== 'team' || user.team !== 'digital') {
      return res.status(403).json({ message: 'Access restricted to Digital team.' });
    }
    req.currentUser = user;
    next();
  } catch (err) {
    console.error('requireDigital error:', err);
    return res.status(401).json({ message: 'Invalid session.' });
  }
}

/* ══════════════════════════════════════════════════════════
   GET /api/digital/events
   All events with per-event stats
══════════════════════════════════════════════════════════ */
router.get('/events', requireDigital, async (req, res) => {
  try {
    const events = await Event.find()
      .select('-gallery.data -bannerData')
      .populate('createdBy', 'name')
      .sort({ eventDate: 1 })
      .lean();

    if (!events.length) return res.json({ events: [], total: 0 });

    const eventIds = events.map(e => e._id);

    /* Registration stats across all events */
    const regAgg = await Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id:       '$eventId',
          total:     { $sum: 1 },
          approved:  { $sum: { $cond: [{ $eq: ['$status', 'approved'] },  1, 0] } },
          attended:  { $sum: { $cond: [{ $eq: ['$status', 'attended'] },  1, 0] } },
          pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending'] },   1, 0] } },
          rejected:  { $sum: { $cond: [{ $eq: ['$status', 'rejected'] },  1, 0] } },
          waitlisted:{ $sum: { $cond: [{ $eq: ['$status', 'waitlisted'] },1, 0] } },
        },
      },
    ]);

    /* Resource + report counts */
    const [resAgg, reportAgg] = await Promise.all([
      Resource.aggregate([
        { $match: { event: { $in: eventIds } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { event: { $in: eventIds } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
    ]);

    const regMap    = Object.fromEntries(regAgg.map(r    => [r._id.toString(), r]));
    const resMap    = Object.fromEntries(resAgg.map(r    => [r._id.toString(), r]));
    const reportMap = Object.fromEntries(reportAgg.map(r => [r._id.toString(), r]));

    const enriched = events.map(e => {
      const id = e._id.toString();
      return {
        ...e,
        stats: {
          registrations: regMap[id] || { total: 0, approved: 0, attended: 0, pending: 0, rejected: 0, waitlisted: 0 },
          resourcesSent: resMap[id]?.count    || 0,
          reportsSent:   reportMap[id]?.count || 0,
        },
      };
    });

    res.json({ events: enriched, total: events.length });
  } catch (err) {
    console.error('GET /digital/events:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/digital/registrations/recent
   Recent registered students (global)
══════════════════════════════════════════════════════════ */
router.get('/registrations/recent', requireDigital, async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 }).limit(8).populate('eventId','title').lean();
    res.json({ registrations: regs.map(r => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      department: r.department,
      year: r.year,
      status: r.status,
      eventTitle: r.eventId?.title || 'N/A',
      createdAt: r.createdAt,
    })) });
  } catch (err) {
    console.error('GET /digital/registrations/recent:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/digital/stats
   Overview stats
══════════════════════════════════════════════════════════ */
router.get('/stats', requireDigital, async (req, res) => {
  try {
    const [totalEvents, totalRegs, resourcesSent, reportsSent, pendingRegs] =
      await Promise.all([
        Event.countDocuments(),
        Registration.countDocuments(),
        Resource.countDocuments(),
        Report.countDocuments(),
        Registration.countDocuments({ status: 'pending' }),
      ]);

    res.json({ totalEvents, totalRegs, resourcesSent, reportsSent, pendingRegs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/digital/events/:eventId/registrations
   Paginated, searchable, filterable registrations
══════════════════════════════════════════════════════════ */
router.get('/events/:eventId/registrations', requireDigital, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 30 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const filter = { eventId: new mongoose.Types.ObjectId(req.params.eventId) };
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: re }, { email: re }, { department: re }];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    res.json({
      registrations,
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('GET /digital/events/:id/registrations:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/digital/events/:eventId/gallery
   Reads gallery from Event model
══════════════════════════════════════════════════════════ */
router.get('/events/:eventId/gallery', requireDigital, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const event = await Event.findById(req.params.eventId)
      .select('title gallery')
      .populate('gallery.uploadedBy', 'name')
      .lean();

    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const photos = (event.gallery || []).map(({ _id, caption, mimeType, uploadedBy, uploadedAt }) => ({
      _id,
      caption,
      mimeType,
      uploadedBy,
      uploadedAt,
      imageUrl: `/api/events/${req.params.eventId}/gallery/${_id}/image`,
    }));

    res.json({ title: event.title, photos, total: photos.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   ANNOUNCEMENTS
══════════════════════════════════════════════════════════ */

/* GET /api/digital/announcements/global — must come BEFORE /:eventId route */
router.get('/announcements/global', requireDigital, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      audience: { $in: ['all', 'digital'] },
      archived: false,
    })
      .populate('postedBy', 'name teamRole')
      .populate('event', 'title')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/digital/events/:eventId/announcements */
router.get('/events/:eventId/announcements', requireDigital, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const announcements = await Announcement.find({
      event:    new mongoose.Types.ObjectId(req.params.eventId),
      archived: false,
    })
      .populate('postedBy', 'name teamRole')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    res.json({ announcements, total: announcements.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   RESOURCES
══════════════════════════════════════════════════════════ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
});

/* POST /api/digital/events/:eventId/resources — Send resource */
router.post('/events/:eventId/resources', requireDigital, upload.single('file'), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!req.file)  return res.status(400).json({ message: 'File is required.' });
    if (!subject)   return res.status(400).json({ message: 'Subject is required.' });
    if (!message)   return res.status(400).json({ message: 'Message is required.' });

    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const event = await Event.findById(req.params.eventId).select('title').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    /* Get approved/attended registrations */
    const regs = await Registration.find({
      eventId:  new mongoose.Types.ObjectId(req.params.eventId),
      status: { $in: ['approved', 'attended'] },
    }).select('_id name email').lean();

    if (!regs.length) {
      return res.status(400).json({ message: 'No approved registrations for this event.' });
    }

    const resource = await Resource.create({
      event:          req.params.eventId,
      originalName:   req.file.originalname,
      mimeType:       req.file.mimetype,
      size:           req.file.size,
      fileData:       req.file.buffer.toString('base64'),
      subject,
      message,
      sentBy:         req.currentUser._id,
      recipientCount: regs.length,
      recipients:     regs.map(r => r._id),
    });

    /* ── Email placeholder ──
       for (const reg of regs) {
         await transporter.sendMail({
           from: 'digital@clustrcore.com', to: reg.email,
           subject, text: message,
           attachments: [{ filename: req.file.originalname, content: req.file.buffer }],
         });
       }
    */
    console.log(`📧 [DEV] Resource "${req.file.originalname}" queued for ${regs.length} students — "${event.title}"`);

    res.status(201).json({
      message:  `Resource queued for ${regs.length} student(s).`,
      count:    regs.length,
      resource: { _id: resource._id, originalName: resource.originalName, recipientCount: resource.recipientCount },
    });
  } catch (err) {
    console.error('POST /digital/events/:id/resources:', err);
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/digital/events/:eventId/resources — History */
router.get('/events/:eventId/resources', requireDigital, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const resources = await Resource.find({ event: req.params.eventId })
      .select('-fileData')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ resources, total: resources.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/digital/events/:eventId/resources/:resourceId/download */
router.get('/events/:eventId/resources/:resourceId/download', requireDigital, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id:   req.params.resourceId,
      event: req.params.eventId,
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    const buffer = Buffer.from(resource.fileData, 'base64');
    res.setHeader('Content-Type', resource.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${resource.originalName}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   MERCHANDISE
══════════════════════════════════════════════════════════ */

/* Public merch browse */
router.get('/merch/public', async (req, res) => {
  try {
    const items = await Merch.find({ archived: false, inStock: true })
      .select('name description price tag photoData photoMime inStock createdBy updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = items.map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      tag: item.tag || 'Available',
      inStock: item.inStock,
      photoUrl: item.photoData ? `data:${item.photoMime};base64,${item.photoData}` : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.json({ items: formatted });
  } catch (err) {
    console.error('GET /digital/merch/public:', err);
    res.status(500).json({ message: err.message });
  }
});

/* List merch (digital team) */
router.get('/merch', requireDigital, async (req, res) => {
  try {
    const items = await Merch.find({ archived: false })
      .select('name description price tag photoData photoMime inStock createdBy updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (err) {
    console.error('GET /digital/merch:', err);
    res.status(500).json({ message: err.message });
  }
});

const merchUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/* Create merch item */
router.post('/merch', requireDigital, merchUpload.single('photo'), async (req, res) => {
  try {
    const { name, description, price, tag, inStock } = req.body;
    if (!name || !price) return res.status(400).json({ message: 'name and price are required.' });
    if (!req.file) return res.status(400).json({ message: 'photo is required.' });

    const merch = await Merch.create({
      name: name.trim(),
      description: (description || '').trim(),
      price: Number(price),
      tag: (tag || '').trim(),
      inStock: inStock === 'false' || inStock === '0' ? false : true,
      photoData: req.file.buffer.toString('base64'),
      photoMime: req.file.mimetype || 'image/jpeg',
      createdBy: req.currentUser._id,
      updatedBy: req.currentUser._id,
    });

    res.status(201).json({ message: 'Merch item added.', item: merch });
  } catch (err) {
    console.error('POST /digital/merch:', err);
    res.status(500).json({ message: err.message });
  }
});

/* Merch image by id */
router.get('/merch/:id/image', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid merch ID.' });
    const m = await Merch.findById(req.params.id).select('photoData photoMime');
    if (!m || !m.photoData) return res.status(404).json({ message: 'Merch image not found.' });
    res.setHeader('Content-Type', m.photoMime || 'image/jpeg');
    res.send(Buffer.from(m.photoData, 'base64'));
  } catch (err) {
    console.error('GET /digital/merch/:id/image:', err);
    res.status(500).json({ message: err.message });
  }
});

/* Update existing merch item */
router.put('/merch/:id', requireDigital, merchUpload.single('photo'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid merch ID.' });
    const { name, description, price, tag, inStock } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (description) update.description = description.trim();
    if (price !== undefined) update.price = Number(price);
    if (tag !== undefined) update.tag = tag.trim();
    if (inStock !== undefined) update.inStock = inStock === 'false' || inStock === '0' ? false : true;
    if (req.file) {
      update.photoData = req.file.buffer.toString('base64');
      update.photoMime = req.file.mimetype || 'image/jpeg';
    }
    update.updatedBy = req.currentUser._id;

    const merch = await Merch.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!merch) return res.status(404).json({ message: 'Merch item not found.' });
    res.json({ message: 'Merch item updated.', item: merch });
  } catch (err) {
    console.error('PUT /digital/merch/:id:', err);
    res.status(500).json({ message: err.message });
  }
});

/* Archive merch item */
router.delete('/merch/:id', requireDigital, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid merch ID.' });
    const merch = await Merch.findByIdAndUpdate(req.params.id, { archived: true, updatedBy: req.currentUser._id }, { new: true });
    if (!merch) return res.status(404).json({ message: 'Merch item not found.' });
    res.json({ message: 'Merch item archived.', item: merch });
  } catch (err) {
    console.error('DELETE /digital/merch/:id:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════════════════ */

/* POST /api/digital/events/:eventId/report/send */
router.post('/events/:eventId/report/send', requireDigital, async (req, res) => {
  try {
    const { facultyName, facultyEmail } = req.body;
    if (!facultyEmail) return res.status(400).json({ message: 'Faculty email is required.' });

    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const event = await Event.findById(req.params.eventId).select('title eventDate venue').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const [regStats, resourceCount] = await Promise.all([
      Registration.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(req.params.eventId) } },
        {
          $group: {
            _id:      null,
            total:    { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] },  1, 0] } },
            attended: { $sum: { $cond: [{ $eq: ['$status', 'attended'] },  1, 0] } },
            pending:  { $sum: { $cond: [{ $eq: ['$status', 'pending'] },   1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] },  1, 0] } },
          },
        },
      ]),
      Resource.countDocuments({ event: req.params.eventId }),
    ]);

    const stats = regStats[0] || { total: 0, approved: 0, attended: 0, pending: 0, rejected: 0 };

    const report = await Report.create({
      event:        req.params.eventId,
      facultyName:  facultyName || '',
      facultyEmail,
      snapshot: {
        totalRegistrations: stats.total,
        approved:           stats.approved,
        attended:           stats.attended,
        pending:            stats.pending,
        rejected:           stats.rejected,
        resourcesSent:      resourceCount,
      },
      sentBy: req.currentUser._id,
    });

    /* ── Email placeholder ──
       await transporter.sendMail({
         from: 'digital@clustrcore.com', to: facultyEmail,
         subject: `Event Report — ${event.title}`,
         html: buildReportHTML(event, stats, resourceCount),
       });
    */
    console.log(`📊 [DEV] Report for "${event.title}" would be emailed to ${facultyEmail}`, stats);

    res.status(201).json({
      message: `Report emailed to ${facultyEmail}.`,
      report:  { _id: report._id, snapshot: report.snapshot },
    });
  } catch (err) {
    console.error('POST /digital/events/:id/report/send:', err);
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/digital/events/:eventId/report/history */
router.get('/events/:eventId/report/history', requireDigital, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    const reports = await Report.find({ event: req.params.eventId })
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reports, total: reports.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   TEAM MEMBERS
   GET /api/digital/members
══════════════════════════════════════════════════════════ */
router.get('/members', requireDigital, async (req, res) => {
  try {
    const members = await User.find(
      { role: 'team', team: 'digital' },
      'name teamRole email'
    ).sort({ name: 1 }).lean();

    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;