const express = require("express");

const router = express.Router();
const User = require("../models/User");
const ParentProfile = require("../models/ParentProfile");

router.post("/find-patient", async (req, res) => {
  try {
    const { email, birthDate } = req.body;

    if (!email || !birthDate) {
      return res.status(400).json({
        message: "Email and birth date are required",
      });
    }

    const patient = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "patient",
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const savedBirthDate = new Date(patient.birthDate)
      .toISOString()
      .split("T")[0];

    const enteredBirthDate = new Date(birthDate)
      .toISOString()
      .split("T")[0];

    if (savedBirthDate !== enteredBirthDate) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      message: "Patient found",
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        role: patient.role,
        birthDate: patient.birthDate,
      },
    });
  } catch (error) {
    console.error("Find patient error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.post("/save-profile", async (req, res) => {
  try {
    const { userId, linkedPatientId, parentName, relationship, phone } = req.body;

    if (!userId || !linkedPatientId || !parentName || !relationship || !phone) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        message: "Family user not found",
      });
    }

    const patientExists = await User.findById(linkedPatientId);
    if (!patientExists) {
      return res.status(404).json({
        message: "Linked patient not found",
      });
    }

    const existingProfile = await ParentProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        message: "Parent profile already exists",
      });
    }

    const parentProfile = await ParentProfile.create({
      userId,
      linkedPatientId,
      parentName,
      relationship,
      phone,
    });

    return res.status(201).json({
      message: "Parent profile saved successfully",
      parentProfile,
    });
  } catch (error) {
    console.error("Save parent profile error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;