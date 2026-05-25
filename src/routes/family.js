const express = require("express");

const router = express.Router();

const User = require("../models/User");
const ParentProfile = require("../models/ParentProfile");
const admin = require("../config/firebaseAdmin");

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
    const { userId, linkedPatientId, parentName, relationship, phone } =
      req.body;

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

router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const parentProfile = await ParentProfile.findOne({ userId }).populate(
      "linkedPatientId",
      "firstName lastName email role birthDate"
    );

    if (!parentProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    return res.status(200).json({
      message: "Parent profile found",
      parentProfile,
    });
  } catch (error) {
    console.error("Get parent profile error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { parentName, relationship, phone } = req.body;

    if (!parentName || !relationship || !phone) {
      return res.status(400).json({
        message: "parentName, relationship and phone are required",
      });
    }

    const updatedProfile = await ParentProfile.findOneAndUpdate(
      { userId },
      {
        parentName,
        relationship,
        phone,
      },
      { new: true }
    ).populate("linkedPatientId", "firstName lastName email role birthDate");

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    return res.status(200).json({
      message: "Parent profile updated successfully",
      parentProfile: updatedProfile,
    });
  } catch (error) {
    console.error("Update parent profile error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/by-patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const families = await ParentProfile.find({
      linkedPatientId: patientId,
    });

    return res.status(200).json({
      success: true,
      families,
    });
  } catch (error) {
    console.error("Get families by patient error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/save-fcm-token", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        message: "userId and token are required",
      });
    }

    const updatedProfile = await ParentProfile.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          fcmTokens: token,
        },
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    return res.status(200).json({
      message: "FCM token saved successfully",
      fcmTokens: updatedProfile.fcmTokens,
    });
  } catch (error) {
    console.error("Save FCM token error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.post("/notify-glucose", async (req, res) => {
  try {
    const { patientId, glucoseValue } = req.body;

    if (!patientId || glucoseValue === undefined) {
      return res.status(400).json({
        message: "patientId and glucoseValue are required",
      });
    }

    const value = Number(glucoseValue);

    if (Number.isNaN(value)) {
      return res.status(400).json({
        message: "glucoseValue must be a number",
      });
    }

    if (value >= 70 && value <= 180) {
      return res.status(200).json({
        sent: false,
        message: "Glucose is in range, no family alert needed",
      });
    }

    const isCritical = value < 40 || value > 400;

    const title = isCritical
      ? "Critical glucose emergency"
      : value < 70
      ? "Low glucose alert"
      : "High glucose alert";

    const body = isCritical
      ? `Patient glucose is ${value.toFixed(
          0
        )} mg/dL. Please check immediately.`
      : value < 70
      ? `Patient glucose is low: ${value.toFixed(0)} mg/dL.`
      : `Patient glucose is high: ${value.toFixed(0)} mg/dL.`;

    const severity = isCritical ? "critical" : "normal";
    const type = isCritical ? "critical_glucose" : "glucose_alert";

    const families = await ParentProfile.find({
      linkedPatientId: patientId,
    });

    const allTokens = [];

    for (const family of families) {
      const familyUserId = family.userId.toString();

      await admin
        .firestore()
        .collection("users")
        .doc(familyUserId)
        .collection("notifications")
        .add({
          title,
          body,
          type,
          severity,
          patientId,
          glucoseValue: value,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      if (Array.isArray(family.fcmTokens)) {
        allTokens.push(...family.fcmTokens);
      }
    }

    const uniqueTokens = [...new Set(allTokens)].filter(Boolean);

    if (uniqueTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: uniqueTokens,
        notification: {
          title,
          body,
        },
        data: {
          type,
          severity,
          patientId: patientId.toString(),
          glucoseValue: value.toString(),
        },
        android: {
          priority: "high",
          notification: {
            channelId: isCritical
              ? "critical_family_channel"
              : "family_alert_channel",
            sound: isCritical ? "critical_alarm" : "default",
          },
        },
      });
    }

    return res.status(200).json({
      sent: true,
      familiesCount: families.length,
      tokensCount: uniqueTokens.length,
    });
  } catch (error) {
    console.error("Notify glucose family error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.post("/notify-lantus-missed", async (req, res) => {
  try {
    const { patientId, scheduledTime } = req.body;

    if (!patientId || !scheduledTime) {
      return res.status(400).json({
        message: "patientId and scheduledTime are required",
      });
    }

    const title = "Critical Lantus reminder";
    const body = `The patient did not confirm taking Lantus after 10 minutes. Scheduled time: ${scheduledTime}.`;

    const families = await ParentProfile.find({
      linkedPatientId: patientId,
    });

    const allTokens = [];

    for (const family of families) {
      const familyUserId = family.userId.toString();

      await admin
        .firestore()
        .collection("users")
        .doc(familyUserId)
        .collection("notifications")
        .add({
          title,
          body,
          type: "critical_lantus_missed",
          severity: "critical",
          patientId,
          scheduledTime,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      if (Array.isArray(family.fcmTokens)) {
        allTokens.push(...family.fcmTokens);
      }
    }

    const uniqueTokens = [...new Set(allTokens)].filter(Boolean);

    if (uniqueTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: uniqueTokens,
        notification: {
          title,
          body,
        },
        data: {
          type: "critical_lantus_missed",
          severity: "critical",
          patientId: patientId.toString(),
          scheduledTime: scheduledTime.toString(),
        },
        android: {
          priority: "high",
          notification: {
            channelId: "critical_family_channel",
            sound: "critical_alarm",
          },
        },
      });
    }

    return res.status(200).json({
      sent: true,
      familiesCount: families.length,
      tokensCount: uniqueTokens.length,
    });
  } catch (error) {
    console.error("Notify lantus missed family error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;