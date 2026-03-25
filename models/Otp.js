const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otp: {
    type: String,   // stored as hashed string
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // Auto-delete document after expiry (TTL index)
    index: { expires: 0 },
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);