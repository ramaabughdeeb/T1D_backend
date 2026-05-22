const express = require('express');
const router = express.Router();

const NutritionistAppointment = require('../models/NutritionistAppointment');
const NutritionistMealPlan = require('../models/NutritionistMealPlan');
const Message = require('../models/Message');
const GlucoseReading = require('../models/GlucoseReading');

function getTodayName() {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return days[new Date().getDay()];
}

function timeAgo(date) {
  if (!date) return '';

  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function getPatientName(patient) {
  if (!patient) return 'Unknown Patient';

  const firstName = patient.firstName || '';
  const lastName = patient.lastName || '';
  const email = patient.email || '';

  const name = `${firstName} ${lastName}`.trim();

  return name || email || 'Unknown Patient';
}

router.get('/:nutritionistId', async (req, res) => {
  try {
    const { nutritionistId } = req.params;
    const today = getTodayName();

    const appointments = await NutritionistAppointment.find({
      nutritionistId,
      status: { $in: ['booked', 'completed'] },
    })
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const todayAppointments = appointments.filter((appointment) => {
      return appointment.day?.toLowerCase() === today.toLowerCase();
    });

    const patientIdsSet = new Set();

    appointments.forEach((appointment) => {
      if (appointment.patientId?._id) {
        patientIdsSet.add(appointment.patientId._id.toString());
      }
    });

    const patientIds = Array.from(patientIdsSet);

    const mealPlans = await NutritionistMealPlan.find({
      nutritionistId,
    })
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const messages = await Message.find({
      receiverId: nutritionistId,
      isRead: false,
    });

    const patientAlerts = [];

    for (const patientId of patientIds) {
      const latestReading = await GlucoseReading.findOne({
        userId: patientId,
      }).sort({ readingTime: -1, createdAt: -1 });

      if (!latestReading) continue;

      const patientAppointment = appointments.find((appointment) => {
        return appointment.patientId?._id?.toString() === patientId;
      });

      const patientName = getPatientName(patientAppointment?.patientId);

      if (latestReading.value > 180) {
        patientAlerts.push({
          name: patientName,
          message: `High glucose: ${latestReading.value} mg/dL`,
          type: 'high_glucose',
          severity: 'high',
        });
      }

      if (latestReading.value < 70) {
        patientAlerts.push({
          name: patientName,
          message: `Low glucose: ${latestReading.value} mg/dL`,
          type: 'low_glucose',
          severity: 'low',
        });
      }
    }

    mealPlans.forEach((plan) => {
      if (plan.status === 'review') {
        patientAlerts.push({
          name: getPatientName(plan.patientId),
          message: 'Meal plan needs review',
          type: 'meal_plan_review',
          severity: 'medium',
        });
      }
    });

    todayAppointments.forEach((appointment) => {
      patientAlerts.push({
        name: getPatientName(appointment.patientId),
        message: `Appointment today at ${appointment.time}`,
        type: 'appointment_today',
        severity: 'info',
      });
    });

    const recentActivities = [];

    appointments.slice(0, 3).forEach((appointment) => {
      recentActivities.push({
        title: `${getPatientName(appointment.patientId)} booked ${appointment.visitType} appointment`,
        time: timeAgo(appointment.createdAt),
      });
    });

    mealPlans.slice(0, 3).forEach((plan) => {
      recentActivities.push({
        title: `${getPatientName(plan.patientId)} assigned: ${plan.planTitle}`,
        time: timeAgo(plan.createdAt),
      });
    });

    const latestMessages = await Message.find({
      receiverId: nutritionistId,
    })
      .populate('senderId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(3);

    latestMessages.forEach((message) => {
      recentActivities.push({
        title: `${getPatientName(message.senderId)} sent a message`,
        time: timeAgo(message.createdAt),
      });
    });

    recentActivities.sort((a, b) => {
      return 0;
    });

    const mealPlansReview = mealPlans.slice(0, 4).map((plan) => ({
      patient: getPatientName(plan.patientId),
      goal: plan.planTitle,
      status: plan.status,
    }));

    return res.status(200).json({
      todayAppointments,
      activePatientsCount: patientIds.length,
      unreadMessagesCount: messages.length,
      pendingMealPlansCount: mealPlans.filter((plan) => plan.status === 'review')
        .length,
      patientAlerts: patientAlerts.slice(0, 5),
      recentActivities: recentActivities.slice(0, 5),
      mealPlansReview,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load nutritionist dashboard',
      error: error.message,
    });
  }
});

module.exports = router;