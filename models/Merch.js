const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   MERCH SCHEMA
   Club merchandise items managed by the
   Digital / Events team, visible on student portal.
   Cash-only payment. Shipping coming soon.
───────────────────────────────────────────── */
const merchSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    price:       { type: Number, required: true, min: 0 },   // INR, cash only

    /* Product photo stored as base64 (swap for URL later) */
    photoData:   { type: String, default: '' },
    photoMime:   { type: String, default: 'image/jpeg' },

    /* Display label — e.g. "Bestseller", "Limited", "New" */
    tag:         { type: String, trim: true, default: '' },

    /* Availability */
    inStock:     { type: Boolean, default: true },

    /* Who created / last updated */
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /* Soft-delete */
    archived:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

merchSchema.index({ archived: 1, inStock: 1, createdAt: -1 });

module.exports = mongoose.model('Merch', merchSchema);