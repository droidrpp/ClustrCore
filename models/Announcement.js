const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   ANNOUNCEMENT SCHEMA
   Posted by Events team.
   Visible to ALL team dashboards and optionally
   a public page.
───────────────────────────────────────────── */
const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    /* Optional: pin to top of feed */
    pinned: {
      type: Boolean,
      default: false,
    },

    /* Which event this relates to (optional) */
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },

    /* Audience: 'all' shows in every dashboard */
    audience: {
      type: String,
      enum: ['all', 'tech', 'events', 'digital'],
      default: 'all',
    },

    /* Priority affects styling in the feed */
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },

    /* Optional attached image */
    imageData: { type: String, default: '' },
    imageMime:  { type: String, default: 'image/jpeg' },

    /* Posted by (Events team member) */
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /* Soft delete */
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ── Indexes ── */
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ audience: 1, archived: 1 });
announcementSchema.index({ pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);