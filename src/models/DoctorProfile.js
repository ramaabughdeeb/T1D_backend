const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
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

    treatsType1: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },

    professionalProofName: {
      type: String,
      required: true,
    },
    professionalProofUrl: {
      type: String,
      required: true,
    },

    cvFileName: {
      type: String,
      default: "",
    },
    cvFileUrl: {
      type: String,
      default: "",
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);