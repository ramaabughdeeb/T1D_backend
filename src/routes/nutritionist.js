const express = require("express");
const router = express.Router();

const User = require("../models/User");
const NutritionistProfile = require("../models/NutritionistProfile");

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
      cvFileName,
      patientConnectionMethod,
      notifyAfterMealHighs,
      notifyNutritionRequests,
      notifyMealPlanFollowUp,
      notifyFoodAllergyAlerts,
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
      !patientConnectionMethod
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
      cvFileName,
      patientConnectionMethod,
      notifyAfterMealHighs,
      notifyNutritionRequests,
      notifyMealPlanFollowUp,
      notifyFoodAllergyAlerts,
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

module.exports = router;