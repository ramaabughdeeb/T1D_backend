const express = require("express");

const router = express.Router();
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");

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
      cvFileName,
      patientConnectionMethod,
      notifyHighGlucose,
      notifyLowGlucose,
      notifyMissedLogs,
      notifyConsultRequests,
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
      !patientConnectionMethod
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
      cvFileName,
      patientConnectionMethod,
      notifyHighGlucose,
      notifyLowGlucose,
      notifyMissedLogs,
      notifyConsultRequests,
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