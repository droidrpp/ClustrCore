const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   CERTIFICATE SCHEMA
   One document per student per event.
   Tracks whether cert was generated & emailed.
───────────────────────────────────────────── */
const certificateSchema = new mongoose.Schema(
  {
    /* Link to Tech team's Registration */
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },

    /* Denormalized for fast queries without joins */
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    studentName:  { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },

    /* Generated SVG/PDF cert stored as base64 (or URL) */
    certData:  { type: String, default: '' },   // base64 SVG
    certMime:  { type: String, default: 'image/svg+xml' },

    /* Delivery */
    emailSent:   { type: Boolean, default: false },
    emailSentAt: { type: Date,    default: null  },

    /* Who issued it */
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

/* Prevent duplicate cert for same student + event */
certificateSchema.index({ registration: 1, event: 1 }, { unique: true });
certificateSchema.index({ event: 1, emailSent: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);