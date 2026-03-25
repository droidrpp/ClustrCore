const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   RESOURCE SCHEMA
   Tracks every file sent by Digital team to
   students of a specific event.
───────────────────────────────────────────── */
const resourceSchema = new mongoose.Schema(
  {
    /* Which event this resource belongs to */
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    /* File details */
    originalName: { type: String, required: true, trim: true },
    mimeType:     { type: String, default: 'application/octet-stream' },
    size:         { type: Number, default: 0 },        // bytes

    /* File stored as base64 (swap for S3/Cloudinary URL later) */
    fileData:     { type: String, required: true },    // base64

    /* Email content */
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    /* Who sent it */
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /* How many students received it */
    recipientCount: { type: Number, default: 0 },

    /* Optional: list of registration IDs that received this */
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Registration' }],
  },
  { timestamps: true }
);

resourceSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);