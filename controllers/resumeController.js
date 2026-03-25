const PDFDocument = require("pdfkit");
const Resume = require("../models/Resume");

exports.createResume = async (req, res) => {
  try {
    const resume = await Resume.create(req.body);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=resume.pdf"
    );

    doc.pipe(res);

    // ===== PDF CONTENT =====
    doc.fontSize(20).text(resume.name, { bold: true });
    doc.moveDown();
    doc.fontSize(12).text(`Email: ${resume.email}`);
    doc.text(`Phone: ${resume.phone}`);
    doc.moveDown();

    doc.fontSize(14).text("Education", { underline: true });
    doc.fontSize(12).text(resume.education);
    doc.moveDown();

    doc.fontSize(14).text("Skills", { underline: true });
    resume.skills.forEach(skill => doc.text(`• ${skill}`));
    doc.moveDown();

    doc.fontSize(14).text("Projects", { underline: true });
    doc.text(resume.projects);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
};
