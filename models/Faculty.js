const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  faculty_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  designation: {
    type: String,
    required: true
  },
  ph_number: {
    type: String,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  qualification: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Faculty", facultySchema);