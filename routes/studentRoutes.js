const express = require("express");
const Student = require("../models/Student");  // Changed from User
const router = express.Router();

// Get student dashboard data (FIXED for real email lookup)
router.get("/dashboard", async (req, res) => {
  try {
    const { email } = req.query;  // Get email from frontend query param
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    const student = await Student.findOne({ email })
      .select('name email course year events');  // Real student fields
    
    if (!student) {
      // Create demo student if none exists
      const demoStudent = await Student.create({
        name: "Demo Student",
        email,
        course: "Computer Science",
        year: 2,
        events: []
      });
      res.json({
        user: demoStudent,
        stats: {
          eventsRegistered: 0,
          competitionsJoined: 0,
          certificatesEarned: 0,
          pointsEarned: 50
        }
      });
      return;
    }

    res.json({
      user: student,
      stats: {
        eventsRegistered: student.events?.length || 0,
        competitionsJoined: 0,
        certificatesEarned: 0,
        pointsEarned: 50,
        eventParticipation: Math.min(100, (student.events?.length || 0) * 25),
        overallActivity: 35
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register for event (NOW UPDATES DATABASE!)
router.post("/events/register", async (req, res) => {
  try {
    const { eventName, email } = req.body;
    const student = await Student.findOneAndUpdate(
      { email },
      { $addToSet: { events: eventName } },  // Adds without duplicates
      { new: true }
    );
    
    res.json({ 
      message: `Successfully registered for ${eventName}!`,
      events: student.events
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Keep other dummy routes
router.post("/competitions/join", (req, res) => {
  res.json({ message: "Joined competition successfully!" });
});

router.post("/certificates/download", (req, res) => {
  res.json({ message: "Certificate downloaded!" });
});

module.exports = router;
