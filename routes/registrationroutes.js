const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Registration = require('../models/Registration');
const Event        = require('../models/Event');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB for screenshot
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG/PNG/WEBP allowed'), ok);
  },
});

/* ══════════════════════════════════════════════════════════
   POST /api/registrations
   Body: multipart/form-data  (paymentScreenshot optional file)
   All form fields come as req.body strings.
══════════════════════════════════════════════════════════ */
router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const {
      eventId, eventName,
      name, email, phone,
      course, year, branch,
      /* hackathon */
      teamName, teamSize, teamMembers, projectIdea,
      /* workshop */
      laptopRequired,
      /* general */
      message,
      /* payment */
      paymentUtrRef,
    } = req.body;

    /* ── Basic validation ── */
    if (!eventId || !name || !email) {
      return res.status(400).json({ message: 'eventId, name and email are required.' });
    }

    /* ── Look up event for category + payment info ── */
    const event = await Event.findById(eventId).select('category title registrationClose').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    /* ── Check registration window ── */
    if (event.registrationClose && new Date() > new Date(event.registrationClose)) {
      return res.status(400).json({ message: 'Registration for this event has closed.' });
    }

    /* ── Parse teamMembers JSON string sent from frontend ── */
    let parsedMembers = [];
    if (teamMembers) {
      try { parsedMembers = JSON.parse(teamMembers); } catch {}
    }

    /* ── Payment screenshot → base64 ── */
    let screenshotBase64 = '';
    if (req.file) {
      screenshotBase64 = req.file.buffer.toString('base64');
    }

    /* Determine payment status */
    const paymentStatus = screenshotBase64
      ? 'screenshot_uploaded'
      : 'not_required';

    const reg = await Registration.create({
      eventId,
      eventName:      eventName || event.title,
      eventCategory:  event.category,

      name:   name.trim(),
      email:  email.trim().toLowerCase(),
      phone:  phone  || undefined,
      course: course || undefined,
      year:   year   ? Number(year) : undefined,
      branch: branch || undefined,

      /* hackathon */
      teamName:    teamName    || undefined,
      teamSize:    teamSize    ? Number(teamSize) : undefined,
      teamMembers: parsedMembers,
      projectIdea: projectIdea || undefined,

      /* workshop */
      laptopRequired: laptopRequired != null ? laptopRequired === 'true' : null,

      message: message || undefined,

      paymentStatus,
      paymentScreenshot: screenshotBase64,
      paymentUtrRef:     paymentUtrRef || '',
    });

    res.status(201).json({
      message:        'Registration successful!',
      registrationId: reg._id,
      paymentStatus:  reg.paymentStatus,
    });

  } catch (err) {
    console.error('🔴 POST /registrations:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered for this event.' });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/registrations/event/:eventId
   Returns all registrations for an event (Tech team)
══════════════════════════════════════════════════════════ */
router.get('/event/:eventId', async (req, res) => {
  try {
    const regs = await Registration.find({ eventId: req.params.eventId })
      .select('-paymentScreenshot')   // don't send base64 in list
      .sort({ createdAt: -1 })
      .lean();
    res.json({ registrations: regs, total: regs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/registrations/:id/screenshot  — download screenshot */
router.get('/:id/screenshot', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id).select('paymentScreenshot').lean();
    if (!reg?.paymentScreenshot) return res.status(404).json({ message: 'No screenshot found.' });
    const buf = Buffer.from(reg.paymentScreenshot, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="payment_${req.params.id}.jpg"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;