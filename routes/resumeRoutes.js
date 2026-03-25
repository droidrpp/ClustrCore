const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/", upload.single("photo"), resumeController.createResume);

module.exports = router;
