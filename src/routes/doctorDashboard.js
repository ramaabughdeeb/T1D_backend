const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const DoctorAppointment = require("../models/DoctorAppointment");
const GlucoseReading = require("../models/GlucoseReading");
const DeletedGlucoseReading = require("../models/DeletedGlucoseReading");
const PatientProfile = require("../models/PatientProfile");
const axios = require("axios");
// Get doctor profile
router.get("/profile/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const user = await User.findById(doctorId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    if (user.role !== "doctor") {
      return res.status(400).json({ message: "This user is not a doctor" });
    }

    const profile = await DoctorProfile.findOne({ userId: doctorId });

    if (!profile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    return res.status(200).json({
      user,
      profile,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Update doctor profile
router.put("/profile/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

  const {
  fullName,
  specialty,
  workplace,
  yearsOfExperience,
  treatsType1,
  ageChildren,
  ageAdolescents,
  ageAdults,
  ageAllAges,
} = req.body;

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: doctorId },
     {
  fullName,
  specialty,
  workplace,
  yearsOfExperience,
  treatsType1,
  ageChildren,
  ageAdolescents,
  ageAdults,
  ageAllAges,
},
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    return res.status(500).json({
      message: "Failed to update doctor profile",
      error: error.message,
    });
  }
});

function calculateAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function formatRelativeTime(date) {
  if (!date) return "No reading";

  const now = new Date();
  const readingDate = new Date(date);
  const diffMs = now - readingDate;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;

  return `${diffDays} d ago`;
}

function getPatientStatus(value) {
  if (value === null || value === undefined) {
    return {
      status: "No Data",
      risk: "No Data",
    };
  }

  if (value < 70) {
    return {
      status: "Low",
      risk: "Urgent",
    };
  }

  if (value > 180) {
    return {
      status: "High",
      risk: "Urgent",
    };
  }

  if (value > 140) {
    return {
      status: "Slightly High",
      risk: "Needs Review",
    };
  }

  return {
    status: "In Range",
    risk: "Stable",
  };
}

// يعرض حالة مرضى الدكتور حسب آخر قراءة سكر
router.get("/patient-status/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const appointments = await DoctorAppointment.find({
      doctorId,
      status: "booked",
    })
      .populate("patientId", "firstName lastName email birthDate role")
      .lean();

    const patientMap = new Map();

    appointments.forEach((appointment) => {
      if (appointment.patientId && appointment.patientId._id) {
        patientMap.set(
          appointment.patientId._id.toString(),
          appointment.patientId
        );
      }
    });

    const patientIds = Array.from(patientMap.keys());

    if (patientIds.length === 0) {
      return res.status(200).json({
        totalPatients: 0,
        highRiskCount: 0,
        inRangeCount: 0,
        noDataCount: 0,
        patients: [],
        highRiskPatients: [],
      });
    }

    const deletedDocs = await DeletedGlucoseReading.find({
      userId: { $in: patientIds },
    })
      .select("readingId")
      .lean();

    const deletedIds = deletedDocs.map((doc) => doc.readingId);

    const patients = [];

    for (const patientId of patientIds) {
      const patient = patientMap.get(patientId);

      const latestReading = await GlucoseReading.findOne({
        userId: patientId,
        _id: { $nin: deletedIds },
      })
        .sort({ readingTime: -1 })
        .lean();

      const value = latestReading ? latestReading.value : null;
      const statusInfo = getPatientStatus(value);

      const fullName = `${patient.firstName || ""} ${
        patient.lastName || ""
      }`.trim();

      patients.push({
        patientId,
        name: fullName || "Unknown Patient",
        email: patient.email || "",
        age: calculateAge(patient.birthDate),
        lastGlucose: value,
        status: statusInfo.status,
        risk: statusInfo.risk,
        time: latestReading
          ? formatRelativeTime(latestReading.readingTime)
          : "No reading",
        readingTime: latestReading ? latestReading.readingTime : null,
      });
    }

    const highRiskPatients = patients.filter(
      (patient) =>
        patient.risk === "Urgent" || patient.risk === "Needs Review"
    );

    const inRangeCount = patients.filter(
      (patient) => patient.status === "In Range"
    ).length;

    const noDataCount = patients.filter(
      (patient) => patient.status === "No Data"
    ).length;

    return res.status(200).json({
      totalPatients: patients.length,
      highRiskCount: highRiskPatients.length,
      inRangeCount,
      noDataCount,
      patients,
      highRiskPatients,
    });
  } catch (error) {
    console.error("Get patient status error:", error);
    return res.status(500).json({
      message: "Failed to get patient status",
      error: error.message,
    });
  }
});

router.get("/patient-details/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient id" });
    }

    const user = await User.findById(patientId).select("-password").lean();

    if (!user) {
      return res.status(404).json({ message: "Patient user not found" });
    }

    if (user.role !== "patient") {
      return res.status(400).json({ message: "This user is not a patient" });
    }

    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    if (!profile) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    return res.status(200).json({
      patient: {
        id: user._id,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        role: user.role || "",
        age: calculateAge(user.birthDate),
      },
      medical: {
        weight: profile.weight ?? null,
        height: profile.height ?? null,
        carbRatio: profile.carbRatio || "",
        correctionFactor: profile.correctionFactor || "",
        lantusDose: profile.lantusDose ?? null,
        lantusTime: profile.lantusTime || "",
        hasFoodAllergy: profile.hasFoodAllergy || false,
        allergyDetails: profile.allergyDetails || "",
        diagnosisDate: profile.diagnosisDate || null,
        managementType: profile.managementType || "",
      },
    });
  } catch (error) {
    console.error("Get patient details error:", error);
    return res.status(500).json({
      message: "Failed to get patient details",
      error: error.message,
    });
  }
});

router.put("/patient-details/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient id" });
    }

    const {
      carbRatio,
      correctionFactor,
      lantusDose,
      lantusTime,
      weight,
      height,
      hasFoodAllergy,
      allergyDetails,
    } = req.body;

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: patientId },
      {
        carbRatio,
        correctionFactor,
        lantusDose,
        lantusTime,
        weight,
        height,
        hasFoodAllergy,
        allergyDetails,
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      message: "Patient medical parameters updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update patient medical parameters error:", error);
    return res.status(500).json({
      message: "Failed to update patient medical parameters",
      error: error.message,
    });
  }
});
router.get("/patient-trend/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        message: "Invalid patient id",
      });
    }

    const readings = await GlucoseReading.find({ userId: patientId })
      .sort({ readingTime: -1 })
      .limit(5)
      .lean();

    if (!readings || readings.length < 3) {
      return res.status(200).json({
        trend: "Insufficient Data",
        message: "Not enough glucose readings to predict the trend.",
        slope: 0,
        readingsCount: readings.length,
      });
    }

    const sortedReadings = readings.sort(
      (a, b) => new Date(a.readingTime) - new Date(b.readingTime)
    );

    const values = sortedReadings.map((r) => Number(r.value));

    const n = values.length;
    const xValues = values.map((_, index) => index + 1);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let trend = "Stable";
    let message = "Glucose readings look mostly stable.";

    if (slope >= 15) {
      trend = "Rising Fast";
      message =
        "Glucose is rising quickly. This patient may need closer medical review.";
    } else if (slope >= 5) {
      trend = "Slightly Rising";
      message =
        "Glucose is gradually rising. Consider monitoring post-meal patterns.";
    } else if (slope <= -15) {
      trend = "Dropping Fast";
      message =
        "Glucose is dropping quickly. This patient may need closer follow-up for low glucose risk.";
    } else if (slope <= -5) {
      trend = "Slightly Dropping";
      message =
        "Glucose is gradually decreasing. Continue monitoring for possible lows.";
    }

    res.status(200).json({
      trend,
      message,
      slope: Number(slope.toFixed(2)),
      readingsCount: readings.length,
      latestReadings: sortedReadings.map((r) => ({
        value: r.value,
        status: r.status,
        readingTime: r.readingTime,
      })),
    });
  } catch (error) {
    console.error("Patient trend error:", error);
    res.status(500).json({
      message: "Failed to calculate glucose trend",
      error: error.message,
    });
  }
});
router.post("/patient-ai-suggestion", async (req, res) => {
  try {
    const {
      patientName,
      age,
      readings,
      trend,
      riskScore,
      timeInRange,
      carbRatio,
      correctionFactor,
      lantusDose,
      lantusTime,
      weight,
      height,
    } = req.body;

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({
        message: "AI key is missing in backend .env",
      });
    }

    const prompt = `
You are helping a diabetes doctor review a Type 1 diabetes patient.

Patient information:
- Name: ${patientName || "Unknown"}
- Age: ${age || "Unknown"}
- Weight: ${weight || "Unknown"} kg
- Height: ${height || "Unknown"} cm
- Carb ratio: ${carbRatio || "Not provided"}
- Correction factor: ${correctionFactor || "Not provided"}
- Lantus dose: ${lantusDose || "Not provided"}
- Lantus time: ${lantusTime || "Not provided"}
- Glucose trend: ${trend || "Unknown"}
- Patient risk score: ${riskScore || "Unknown"}
- Time in range: ${JSON.stringify(timeInRange || {})}

Recent glucose readings:
${JSON.stringify(readings || [])}

Important safety rules:
- Do NOT give exact insulin dose changes.
- Do NOT say "increase Lantus" or "decrease Lantus" as a direct instruction.
- Do NOT prescribe treatment.
- Only suggest what the doctor may need to review.
- Keep it short and practical.
- Maximum 3 bullet points.
- Focus on whether carb ratio, correction factor, or Lantus plan may need doctor review.
- Use simple clinical English.
`;

const aiResponse = await axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a safe clinical decision support assistant for doctors. You provide cautious review suggestions only, not medical orders.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 220,
    temperature: 0.3,
  },
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
  }
);

const suggestion =
  aiResponse.data?.choices?.[0]?.message?.content ||
  "No AI suggestion generated.";

    return res.status(200).json({
      suggestion,
    });
  } catch (error) {
    console.error("Patient AI suggestion error:", error);
    return res.status(500).json({
      message: "Failed to generate AI suggestion",
      error: error.message,
    });
  }
});
module.exports = router;