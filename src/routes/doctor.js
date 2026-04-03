const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");

// =========================
// Create uploads folder
// =========================
const uploadDir = path.join(__dirname, "..", "uploads", "doctor-files");
fs.mkdirSync(uploadDir, { recursive: true });

// =========================
// Multer config
// =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// =========================
// Upload file route
// =========================
router.post(
  "/upload/:userId",
  upload.fields([
    { name: "professionalProof", maxCount: 1 },
    { name: "cvFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }

      let uploadedFile = null;
      let fileType = "";

      if (req.files?.professionalProof?.[0]) {
        uploadedFile = req.files.professionalProof[0];
        fileType = "professionalProof";
      } else if (req.files?.cvFile?.[0]) {
        uploadedFile = req.files.cvFile[0];
        fileType = "cvFile";
      }

      if (!uploadedFile) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/doctor-files/${uploadedFile.filename}`;

      return res.status(201).json({
        message: "File uploaded successfully",
        userId,
        fileType,
        fileName: uploadedFile.originalname,
        storedFileName: uploadedFile.filename,
        fileUrl,
      });
    } catch (error) {
      console.error("Upload doctor file error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// =========================
// Save doctor profile
// =========================
router.post("/save-profile", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      phone,
      workplace,
      specialty,
      otherSpecialty,
      yearsOfExperience,
      ageChildren,
      ageAdolescents,
      ageAdults,
      ageAllAges,
      treatsType1,
      professionalProofName,
      professionalProofUrl,
      cvFileName,
      cvFileUrl,
    } = req.body;

    if (
      !userId ||
      !fullName ||
      !phone ||
      !workplace ||
      !specialty ||
      yearsOfExperience === undefined ||
      !treatsType1 ||
      !professionalProofName ||
      !professionalProofUrl
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = await DoctorProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: "Doctor profile already exists" });
    }

    const doctorProfile = await DoctorProfile.create({
      userId,
      fullName,
      phone,
      workplace,
      specialty,
      otherSpecialty,
      yearsOfExperience,
      ageChildren,
      ageAdolescents,
      ageAdults,
      ageAllAges,
      treatsType1,
      professionalProofName,
      professionalProofUrl,
      cvFileName,
      cvFileUrl,
    });

    return res.status(201).json({
      message: "Doctor profile saved successfully",
      doctorProfile,
    });
  } catch (error) {
    console.error("Save doctor profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;