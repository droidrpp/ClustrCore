const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const User     = require('../models/User');
const Otp      = require('../models/Otp');

/* ── UTIL: generate 6-digit OTP ──────────────────────── */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ── UTIL: simulate SMS (replace with Twilio/MSG91) ──── */
async function sendSms(phone, otp) {
  // 🔧 REPLACE THIS with real SMS provider:
  //
  // ── Twilio example: ──────────────────────────────────
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await twilio.messages.create({
  //   body: `Your ClustrCore OTP is: ${otp}. Valid for 10 minutes.`,
  //   from: process.env.TWILIO_PHONE,
  //   to: `+91${phone}`,
  // });
  //
  // ── MSG91 example: ───────────────────────────────────
  // const axios = require('axios');
  // await axios.post('https://api.msg91.com/api/v5/otp', {
  //   template_id: process.env.MSG91_TEMPLATE_ID,
  //   mobile: `91${phone}`,
  //   otp,
  // }, { headers: { authkey: process.env.MSG91_KEY } });
  //
  // For now, log to console in dev mode:
  console.log(`📱 [DEV] OTP for ${phone}: ${otp}`);
}

/* ══════════════════════════════════════════════════════════
   POST /api/team/send-otp
   Body: { name, team }
   — Looks up user by name + team, sends OTP to their phone
══════════════════════════════════════════════════════════ */
router.post('/send-otp', async (req, res) => {
  try {
    const { name, team } = req.body;

    if (!name || !team) {
      return res.status(400).json({ message: 'Name and team are required.' });
    }

    // Find the user — case-insensitive name match, must be team role + correct team
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      role: 'team',
      team: team.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: 'No team member found with that name in this team.',
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        message: 'No phone number registered for this account.',
      });
    }

    // Delete any existing unused OTP for this user
    await Otp.deleteMany({ userId: user._id });

    // Generate + hash OTP
    const raw  = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(raw, salt);

    // Save to DB — expires in 10 minutes
    await Otp.create({
      userId:    user._id,
      otp:       hash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send SMS
    await sendSms(user.phone, raw);

    // Return masked phone for UI display (e.g. ****3456)
    const masked = user.phone.slice(-4).padStart(user.phone.length, '*');

    res.json({
      message: `OTP sent to ${masked}`,
      userId:  user._id,        // needed for verify step
      masked,
    });

  } catch (err) {
    console.error('🔴 send-otp error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/team/verify-otp
   Body: { userId, otp }
   — Verifies OTP, returns user info for dashboard
══════════════════════════════════════════════════════════ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'userId and otp are required.' });
    }

    // Find the latest OTP record for this user
    const record = await Otp.findOne({
      userId,
      verified:  false,
      expiresAt: { $gt: new Date() },  // not expired
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        message: 'OTP expired or not found. Please request a new one.',
      });
    }

    // Compare
    const isMatch = await bcrypt.compare(otp.toString(), record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Mark as verified + delete record
    await Otp.deleteOne({ _id: record._id });

    // Fetch user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Save session in response
    res.json({
      message: 'OTP verified successfully.',
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        team:     user.team,
        teamRole: user.teamRole,
        phone:    user.phone,
      },
    });

  } catch (err) {
    console.error('🔴 verify-otp error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/team/members/:team
   — Returns list of members for a given team (for dropdown)
══════════════════════════════════════════════════════════ */
router.get('/members/:team', async (req, res) => {
  try {
    const { team } = req.params;

    if (!['tech', 'events', 'digital'].includes(team)) {
      return res.status(400).json({ message: 'Invalid team name.' });
    }

    const members = await User.find(
      { role: 'team', team },
      'name teamRole'   // only return name + role, no sensitive fields
    ).sort({ name: 1 });

    res.json({ members });

  } catch (err) {
    console.error('🔴 members error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;