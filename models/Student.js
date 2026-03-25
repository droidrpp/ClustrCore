const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      match: [/^[A-Za-z\s]+$/, "Name must contain only letters"]
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    course: String,
    year: Number,
    branch: String,
    session: String,
    hostel_address: String,
    phone_number: String,
    gender: String,
    
    // ===== ADD THESE FIELDS FOR DASHBOARD =====
    events: [{
      type: String,  // "AI_Seminar", "Web_Workshop", etc.
      default: []
    }],
    competitions: [{
      type: String,
      default: []
    }],
    certificates: [{
      type: String,
      default: []
    }],
    points: {
      type: Number,
      default: 0
    }
    // ===== END ADD =====
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
