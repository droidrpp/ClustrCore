const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
require("dotenv").config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// DEBUG: require ko variable mein lo
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const Teamroutes = require("./routes/Teamroutes");
const Otproutes = require("./routes/Otproutes");
const eventRoutes =  require("./routes/eventRoutes");
const techRoutes = require('./routes/techRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const Digitalroutes = require('./routes/Digitalroutes');
const Studentresourceroute = require('./routes/Studentresourceroute');
//const Chatbotroutes = require('./routes/Chatbotroutes');

console.log("studentRoutes =", studentRoutes);
console.log("authRoutes    =", authRoutes);
console.log("resumeRoutes  =", resumeRoutes);
console.log("Teamroutes  =", Teamroutes);
console.log("OtpRoutes  =", Otproutes);
console.log("eventRoutes =",eventRoutes);
console.log("techRoutes =", techRoutes);
console.log("registrationRoutes =", registrationRoutes);
console.log("Digitalroutes =", Digitalroutes );
console.log("Studentresourceroute ", Studentresourceroute);
//console.log("Chatbotroutes ", Chatbotroutes);

// Generate a sample OTP for testing
const sampleOtp = Math.floor(100000 + Math.random() * 900000);
console.log(`\n🔐 SAMPLE OTP FOR TESTING: ${sampleOtp}`);
console.log(`📱 Use this OTP in development when testing the portal\n`);

app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/team", Teamroutes);
app.use("/api/otp", Otproutes);
app.use("/api/events",eventRoutes);
app.use('/api/tech', techRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/digital", Digitalroutes);
app.use("/api/studentresources", Studentresourceroute);
//app.use("/api/chatbot", Chatbotroutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


