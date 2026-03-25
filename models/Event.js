const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   TASK SUB-SCHEMA
───────────────────────────────────────────── */
const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    notes:       { type: String, trim: true, default: '' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'inprogress', 'done'],
      default: 'todo',
    },
    assignedTo: { type: String, trim: true, default: '' },
    dueDate:    { type: Date },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

/* ─────────────────────────────────────────────
   AGENDA ITEM SUB-SCHEMA
───────────────────────────────────────────── */
const agendaItemSchema = new mongoose.Schema(
  {
    time:        { type: String, trim: true, default: '' },
    title:       { type: String, required: true, trim: true },
    speaker:     { type: String, trim: true, default: '' },
    duration:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['talk', 'workshop', 'break', 'panel', 'networking', 'other'],
      default: 'talk',
    },
  },
  { _id: true }
);

/* ─────────────────────────────────────────────
   GALLERY PHOTO SUB-SCHEMA
───────────────────────────────────────────── */
const galleryPhotoSchema = new mongoose.Schema(
  {
    caption:    { type: String, trim: true, default: '' },
    data:       { type: String, required: true },
    mimeType:   { type: String, default: 'image/jpeg' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ─────────────────────────────────────────────
   COMPANY COLLABORATION SUB-SCHEMA
   Stores sponsor / partner companies per event.
   Logo stored as base64 — swap for URL when
   you move to Cloudinary/S3.
───────────────────────────────────────────── */
const companySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['sponsor', 'partner', 'organiser', 'supporter', 'media'],
      default: 'partner',
    },
    website:     { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    logoData:    { type: String, default: '' },   // base64
    logoMime:    { type: String, default: 'image/png' },
    addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

/* ─────────────────────────────────────────────
   MENTOR / JUDGE / SPEAKER SUB-SCHEMA
───────────────────────────────────────────── */
const mentorSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    title:     { type: String, trim: true, default: '' },   // "Senior Engineer, Google"
    role: {
      type: String,
      enum: ['mentor', 'judge', 'speaker', 'panelist', 'guest'],
      default: 'mentor',
    },
    bio:       { type: String, trim: true, default: '' },
    linkedin:  { type: String, trim: true, default: '' },
    photoData: { type: String, default: '' },   // base64
    photoMime: { type: String, default: 'image/jpeg' },
    addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

/* ─────────────────────────────────────────────
   EVENT SCHEMA
───────────────────────────────────────────── */
const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    category: {
      type: String,
      enum: ['workshop', 'hackathon', 'seminar', 'competition', 'webinar', 'other'],
      default: 'other',
    },

    eventDate: { type: Date, required: true },
    endDate:   { type: Date },
    venue:     { type: String, trim: true, default: 'TBD' },

    registrationOpen:  { type: Date },
    registrationClose: { type: Date },
    capacity:          { type: Number, default: null },

    registrationFee: { type: Number, default: 0 },
    qrImageData:     { type: String, default: '' },
    qrImageMime:     { type: String, default: 'image/jpeg' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'completed', 'cancelled'],
      default: 'draft',
    },

    views: { type: Number, default: 0 },
    tags:  [{ type: String, trim: true }],

    bannerData: { type: String, default: '' },
    bannerMime: { type: String, default: 'image/jpeg' },

    tasks:   [taskSchema],
    agenda:  [agendaItemSchema],
    gallery: [galleryPhotoSchema],

    /* ✅ NEW */
    companies: [companySchema],
    mentors:   [mentorSchema],
  },
  { timestamps: true }
);

eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ createdAt: -1 });

eventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  return (
    this.status === 'open' &&
    this.registrationOpen &&
    this.registrationClose &&
    now >= this.registrationOpen &&
    now <= this.registrationClose
  );
});

module.exports = mongoose.model('Event', eventSchema);