const mongoose = require('mongoose');

/* ── Team member sub-schema (for hackathons) ── */
const teamMemberSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const RegistrationSchema = new mongoose.Schema(
  {
    /* ── Event reference ── */
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    /* Category snapshot so queries don't need to join Event */
    eventCategory: {
      type: String,
      enum: ['workshop', 'hackathon', 'seminar', 'competition', 'webinar', 'other'],
      default: 'other',
    },

    /* ── Personal info ── */
    name: {
      type: String,
      required: true,
      trim: true,
      match: [/^[A-Za-z\s]+$/, 'Name must contain only letters'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },

    /* ── Academic info ── */
    course: { type: String, trim: true },
    year:   { type: Number },
    branch: { type: String, trim: true },

    /* ── Hackathon-specific ── */
    teamName:    { type: String, trim: true },
    teamSize:    { type: Number, min: 1, max: 6 },
    teamMembers: [teamMemberSchema],         // other members besides registrant
    projectIdea: { type: String, trim: true },

    /* ── Workshop-specific ── */
    laptopRequired: { type: Boolean, default: null },

    /* ── General ── */
    message: { type: String, trim: true },

    /* ── Payment ── */
    paymentRequired: { type: Boolean, default: false },
    paymentAmount:   { type: Number,  default: 0 },      // ₹
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'screenshot_uploaded', 'verified', 'rejected'],
      default: 'not_required',
    },
    paymentScreenshot: {
      type: String,   // base64 — swap for Cloudinary URL later
      default: '',
    },
    paymentUtrRef: { type: String, trim: true, default: '' }, // UTR / transaction ID
    paymentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paymentVerifiedAt: { type: Date, default: null },

    /* ── Status (managed by Tech team) ── */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'waitlisted', 'attended'],
      default: 'pending',
    },

    /* ── Certificate ── */
    certificateSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* Prevent duplicate registration for same event + email */
RegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Registration', RegistrationSchema);