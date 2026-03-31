const mongoose = require("mongoose");


const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    guardianName: { type: String, default: "" },
    guardianPhone: { type: String, default: "" },
    guardianRelation: { type: String, default: "" },

    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    diagnosisDate: { type: Date, required: true },

    usesRapidInsulin: { type: Boolean, default: false },
    usesBasalInsulin: { type: Boolean, default: false },
    usesMixedInsulin: { type: Boolean, default: false },
    usesPump: { type: Boolean, default: false },
    usesPills: { type: Boolean, default: false },
    usesOtherTreatment: { type: Boolean, default: false },

    otherTreatmentName: { type: String, default: "" },

    managementType: {
      type: String,
      enum: ["Carb Counting", "Fixed Doses", "I Don't Know"],
      required: true,
    },

    breakfastDose: { type: Number, default: null },
    lunchDose: { type: Number, default: null },
    dinnerDose: { type: Number, default: null },
    lantusDose: { type: Number, default: null },

    correctionFactor: { type: String, default: "" },
    carbRatio: { type: String, default: "" },

    hasFoodAllergy: { type: Boolean, default: false },
    allergyDetails: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);