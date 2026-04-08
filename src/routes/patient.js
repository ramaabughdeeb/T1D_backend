const express = require("express");

const router = express.Router();
const PatientProfile = require("../models/PatientProfile");
const User = require("../models/User");

// SAVE PATIENT PROFILE
router.post("/save-profile", async (req, res) => {
  try {
    const {
      userId,
      guardianName,
      guardianPhone,
      guardianRelation,
      height,
      weight,
      diagnosisDate,
      usesRapidInsulin,
      usesBasalInsulin,
      usesMixedInsulin,
      usesPump,
      usesPills,
      usesOtherTreatment,
      otherTreatmentName,
      managementType,
      breakfastDose,
      lunchDose,
      dinnerDose,
      lantusDose,
      correctionFactor,
      carbRatio,
      hasFoodAllergy,
      allergyDetails,
    } = req.body;

    if (!userId || !height || !weight || !diagnosisDate || !managementType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProfile = await PatientProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: "Patient profile already exists" });
    }

    const patientProfile = await PatientProfile.create({
      userId,
      guardianName,
      guardianPhone,
      guardianRelation,
      height,
      weight,
      diagnosisDate,
      usesRapidInsulin,
      usesBasalInsulin,
      usesMixedInsulin,
      usesPump,
      usesPills,
      usesOtherTreatment,
      otherTreatmentName,
      managementType,
      breakfastDose,
      lunchDose,
      dinnerDose,
      lantusDose,
      correctionFactor,
      carbRatio,
      hasFoodAllergy,
      allergyDetails,
    });

    res.status(201).json({
      message: "Patient profile saved successfully",
      patientProfile,
    });
  } catch (error) {
    console.error("Save patient profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PATIENT PROFILE BY USER ID
router.get("/:userId", async (req, res) => {
  try {
    const patient = await PatientProfile.findOne({ userId: req.params.userId });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;