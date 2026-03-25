const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   REPORT SCHEMA
   Tracks every report emailed to faculty
   for a specific event by the Digital team.
───────────────────────────────────────────── */
const reportSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    /* Faculty recipient */
    facultyName:  { type: String, trim: true, default: '' },
    facultyEmail: { type: String, required: true, trim: true, lowercase: true },

    /* Snapshot of stats at send time */
    snapshot: {
      totalRegistrations: { type: Number, default: 0 },
      approved:           { type: Number, default: 0 },
      attended:           { type: Number, default: 0 },
      certificatesSent:   { type: Number, default: 0 },
    },

    /* Who sent it */
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);