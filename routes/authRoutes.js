const express = require("express");
const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const multer  = require("multer");
const router  = express.Router();

// ── Multer setup for photo uploads ──────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/auth/signup
══════════════════════════════════════════════════════════ */
router.post("/signup", upload.single('photo'), async (req, res) => {
  try {
    const {
      name, email, password,
      role = "student",
      // team & admin
      phone,
      // team only
      team, teamRole,
      // social links
      linkedin, github
    } = req.body;

    // ── Basic field check ───────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    // ── Role-specific field checks ──────────────────────
    if (role === "team" || role === "admin") {
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required for team and admin accounts." });
      }
    }

    if (role === "team") {
      if (!team) {
        return res.status(400).json({ message: "Please select your team (tech / events / digital)." });
      }
      if (!teamRole) {
        return res.status(400).json({ message: "Please select your role within the team." });
      }
    }

    // ── Photo upload handling (optional, for team/admin) ───────────────────────────────
    let photoData = null;
    let photoMime = null;
    if (req.file && (role === 'team' || role === 'admin')) {
      photoData = req.file.buffer.toString('base64');
      photoMime = req.file.mimetype;
    }

    // ── Duplicate email check ───────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // ── Create user ─────────────────────────────────────
    const user = new User({
      name,
      email,
      password,
      role,
      // Only set if provided (schema defaults to null)
      ...(phone && { phone }),
      ...(team && { team }),
      ...(teamRole && { teamRole }),
      ...(photoData && { photo: photoData }),
      ...(photoMime && { photoMime: photoMime }),
      ...(linkedin && { linkedin }),
      ...(github && { github }),
    });

    await user.save();

    res.status(201).json({
      message: "Account created successfully! Please log in.",
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        ...(user.phone && { phone: user.phone }),
        ...(user.team && { team: user.team }),
        ...(user.teamRole && { teamRole: user.teamRole }),
        ...(user.photo && { photo: user.photo }),
        ...(user.linkedin && { linkedin: user.linkedin }),
        ...(user.github && { github: user.github }),
      },
    });

  } catch (err) {
    console.error("🔴 Signup error:", err.message);

    // Mongoose validation errors — return them cleanly
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(" ") });
    }

    // Duplicate key (race condition)
    if (err.code === 11000) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    res.status(500).json({
      message: err.message || "Server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/auth/login
══════════════════════════════════════════════════════════ */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ── Find user ───────────────────────────────────────
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // ── Role check ──────────────────────────────────────
    if (role && user.role !== role) {
      return res.status(400).json({ message: `This account is not registered as ${role}.` });
    }

    // ── Password check ──────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // ── Success ─────────────────────────────────────────
    res.json({
      message: "Login successful",
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        // Include team fields if present
        ...(user.phone    && { phone:    user.phone }),
        ...(user.team     && { team:     user.team }),
        ...(user.teamRole && { teamRole: user.teamRole }),
      },
    });

  } catch (err) {
    console.error("🔴 Login error:", err.message);
    res.status(500).json({
      message: err.message || "Server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
});

module.exports = router;