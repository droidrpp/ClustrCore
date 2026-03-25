const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,   // ✅ FIXED
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ClustrCore" <${process.env.EMAIL_USER}>`, // ✅ FIXED
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};

module.exports = sendEmail;
