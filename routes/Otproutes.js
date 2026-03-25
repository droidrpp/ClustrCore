const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const User    = require('../models/User');
const Otp     = require('../models/Otp');

/* ── UTIL: generate 6-digit OTP ──────────────────────── */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ── UTIL: send SMS (replace with real provider) ─────── */
async function sendSms(phone, otp) {
  // 🔧 REPLACE with Twilio or MSG91 before deploying
  //
  // ── Twilio ───────────────────────────────────────────
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await twilio.messages.create({
  //   body: `Your ClustrCore OTP is: ${otp}. Valid for 10 minutes. Do not share this.`,
  //   from: process.env.TWILIO_PHONE,
  //   to: `+91${phone}`,
  // });
  //
  // ── MSG91 ────────────────────────────────────────────
  // const axios = require('axios');
  // await axios.post('https://api.msg91.com/api/v5/otp', {
  //   template_id: process.env.MSG91_TEMPLATE_ID,
  //   mobile: `91${phone}`,
  //   otp,
  // }, { headers: { authkey: process.env.MSG91_KEY, 'content-type': 'application/json' } });
  //
  console.log(`📱 [DEV] OTP for +91${phone} → ${otp}`);
}

/* ══════════════════════════════════════════════════════════
   POST /api/otp/send
   Body: { name, team }
   Finds user by name + team, sends OTP to their phone
══════════════════════════════════════════════════════════ */
router.post('/send', async (req, res) => {
  try {
    const { name, team } = req.body;

    // ── Validate input ──────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (!team) {
      return res.status(400).json({ message: 'Team is required.' });
    }
    if (!['tech', 'events', 'digital'].includes(team.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid team. Must be tech, events, or digital.' });
    }

    // ── Find user ───────────────────────────────────────
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      role: 'team',
      team: team.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: 'No member found with that name in this team. Please check your selection.',
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        message: 'No phone number is registered for this account. Contact your admin.',
      });
    }

    // ── Delete any existing OTPs for this user ──────────
    await Otp.deleteMany({ userId: user._id });

    // ── Generate + hash OTP ─────────────────────────────
    const rawOtp  = generateOtp();
    const salt    = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    // ── Save to DB (expires in 10 minutes) ──────────────
    await Otp.create({
      userId:    user._id,
      otp:       hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified:  false,
    });

    // ── Send SMS ────────────────────────────────────────
    await sendSms(user.phone, rawOtp);

    // ── Mask phone for UI (e.g. ******3456) ────────────
    const masked = user.phone.slice(-4).padStart(user.phone.length, '*');

    return res.status(200).json({
      message: `OTP sent successfully to ${masked}.`,
      userId:  user._id,   // frontend needs this for /verify
      masked,
    });

  } catch (err) {
    console.error('🔴 OTP send error:', err.message);
    res.status(500).json({
      message: err.message || 'Failed to send OTP. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/otp/verify
   Body: { userId, otp }
   Verifies OTP — returns full user object on success
══════════════════════════════════════════════════════════ */
router.post('/verify', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // ── Validate input ──────────────────────────────────
    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }
    if (!otp || otp.toString().length !== 6) {
      return res.status(400).json({ message: 'A valid 6-digit OTP is required.' });
    }

    // ── Find latest valid (non-expired, unverified) OTP ─
    const record = await Otp.findOne({
      userId,
      verified:  false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        message: 'OTP has expired or was not found. Please request a new one.',
      });
    }

    // ── Compare ─────────────────────────────────────────
    const isMatch = await bcrypt.compare(otp.toString(), record.otp);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // ── Mark verified + delete record ──────────────────
    await Otp.deleteOne({ _id: record._id });

    // ── Fetch user (no password) ────────────────────────
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
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
    console.error('🔴 OTP verify error:', err.message);
    res.status(500).json({
      message: err.message || 'Verification failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/otp/resend
   Body: { userId }
   Deletes old OTP and sends a fresh one (rate-limited to 
   once per 60s via lastSentAt check)
══════════════════════════════════════════════════════════ */
router.post('/resend', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    // ── Rate-limit: block if OTP sent within last 30 secs ─
    const recent = await Otp.findOne({ userId }).sort({ createdAt: -1 });
    if (recent) {
      const secondsAgo = (Date.now() - new Date(recent.createdAt).getTime()) / 1000;
      if (secondsAgo < 30) {
        const waitSecs = Math.ceil(30 - secondsAgo);
        return res.status(429).json({
          message: `Please wait ${waitSecs} second${waitSecs !== 1 ? 's' : ''} before resending.`,
        });
      }
    }

    // ── Find user ───────────────────────────────────────
    const user = await User.findById(userId).select('name phone team role');
    if (!user || user.role !== 'team' || !user.phone) {
      return res.status(404).json({ message: 'User not found or has no phone number.' });
    }

    // ── Delete old OTPs ─────────────────────────────────
    await Otp.deleteMany({ userId });

    // ── Generate + hash new OTP ─────────────────────────
    const rawOtp    = generateOtp();
    const salt      = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    await Otp.create({
      userId,
      otp:       hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified:  false,
    });

    await sendSms(user.phone, rawOtp);

    const masked = user.phone.slice(-4).padStart(user.phone.length, '*');

    return res.status(200).json({
      message: `New OTP sent to ${masked}.`,
      masked,
    });

  } catch (err) {
    console.error('🔴 OTP resend error:', err.message);
    res.status(500).json({
      message: err.message || 'Resend failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
});

module.exports = router;