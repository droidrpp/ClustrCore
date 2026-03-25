const express = require("express");
const router = express.Router();
const Student = require("../models/Student"); // Apne model ka sahi path daal do

// Register new student
router.post("/register", async (req, res) => {
  try {
    const { name, email, course, year, branch, session, hostel_address, phone_number, gender } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ 
        message: "Student with this email already exists" 
      });
    }

    // Create new student
    const student = new Student({
      name,
      email,
      course,
      year,
      branch,
      session,
      hostel_address,
      phone_number,
      gender
    });

    await student.save();

    res.status(201).json({ 
      message: "Student registered successfully", 
      data: student 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Error registering student", 
      error: error.message 
    });
  }
});

// Get all students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({ data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ 
      message: "Error fetching students", 
      error: error.message 
    });
  }
});

// Get student by ID
router.get("/student/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ data: student });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      message: "Error fetching student", 
      error: error.message 
    });
  }
});

// Get student by email
router.get("/student/email/:email", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ data: student });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      message: "Error fetching student", 
      error: error.message 
    });
  }
});

// Update student
router.put("/student/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ 
      message: "Student updated successfully", 
      data: student 
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ 
      message: "Error updating student", 
      error: error.message 
    });
  }
});

// Delete student
router.delete("/student/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ 
      message: "Student deleted successfully" 
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ 
      message: "Error deleting student", 
      error: error.message 
    });
  }
});

module.exports = router;