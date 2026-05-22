const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();

const User = require("../models/User");
const NutritionistProfile = require("../models/NutritionistProfile");

// =========================
// Create uploads folder
// =========================
const uploadDir = path.join(__dirname, "..", "uploads", "nutritionist-files");
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

      const fileUrl = `/uploads/nutritionist-files/${uploadedFile.filename}`;

      return res.status(201).json({
        message: "File uploaded successfully",
        userId,
        fileType,
        fileName: uploadedFile.originalname,
        storedFileName: uploadedFile.filename,
        fileUrl,
      });
    } catch (error) {
      console.error("Upload nutritionist file error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// =========================
// Save nutritionist profile
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
      hasType1Experience,
      planningStyle,
      otherPlanningStyle,
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
      !hasType1Experience ||
      !planningStyle ||
      !professionalProofName ||
      !professionalProofUrl
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = await NutritionistProfile.findOne({ userId });
    if (existingProfile) {
      return res
        .status(400)
        .json({ message: "Nutritionist profile already exists" });
    }

    const nutritionistProfile = await NutritionistProfile.create({
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
      hasType1Experience,
      planningStyle,
      otherPlanningStyle,
      professionalProofName,
      professionalProofUrl,
      cvFileName,
      cvFileUrl,
    });

    return res.status(201).json({
      message: "Nutritionist profile saved successfully",
      nutritionistProfile,
    });
  } catch (error) {
    console.error("Save nutritionist profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "firstName lastName email role"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const profile = await NutritionistProfile.findOne({ userId });

    return res.status(200).json({
      user,
      profile,
    });
  } catch (error) {
    console.error("Get nutritionist profile error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      firstName,
      lastName,
      phone,
      workplace,
      specialty,
      yearsOfExperience,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
      },
      { new: true }
    ).select('firstName lastName email role');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const updatedProfile = await NutritionistProfile.findOneAndUpdate(
      { userId },
      {
        phone,
        workplace,
        specialty,
        yearsOfExperience,
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
      profile: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update nutritionist profile',
      error: error.message,
    });
  }
});

module.exports = router;