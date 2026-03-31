const mongoose = require("mongoose");


const nutritionistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    workplace: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    otherSpecialty: {
      type: String,
      default: "",
    },

    yearsOfExperience: {
      type: Number,
      required: true,
    },

    ageChildren: {
      type: Boolean,
      default: false,
    },
    ageAdolescents: {
      type: Boolean,
      default: false,
    },
    ageAdults: {
      type: Boolean,
      default: false,
    },
    ageAllAges: {
      type: Boolean,
      default: false,
    },

    hasType1Experience: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },

    planningStyle: {
      type: String,
      required: true,
    },
    otherPlanningStyle: {
      type: String,
      default: "",
    },

    professionalProofName: {
      type: String,
      required: true,
    },
    cvFileName: {
      type: String,
      default: "",
    },

    patientConnectionMethod: {
      type: String,
      required: true,
    },

    notifyAfterMealHighs: {
      type: Boolean,
      default: false,
    },
    notifyNutritionRequests: {
      type: Boolean,
      default: false,
    },
    notifyMealPlanFollowUp: {
      type: Boolean,
      default: false,
    },
    notifyFoodAllergyAlerts: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NutritionistProfile",
  nutritionistProfileSchema
);