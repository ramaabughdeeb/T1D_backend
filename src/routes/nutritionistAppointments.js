const express = require('express');
const router = express.Router();

const NutritionistAppointment = require('../models/NutritionistAppointment');
const NutritionistAvailability = require('../models/NutritionistAvailability');
const NutritionistProfile = require('../models/NutritionistProfile');

const {
  createGoogleMeetEvent,
} = require('../services/googleCalendarService');

// يفحص إذا المريض عنده حجز نشط
router.get('/active/:patientId', async (req, res) => {
  try {
    const appointment = await NutritionistAppointment.findOne({
      patientId: req.params.patientId,
      status: { $in: ['pending_payment', 'booked'] },
    }).populate('nutritionistId', 'firstName lastName email role');

    if (!appointment) {
      return res.json({ hasAppointment: false });
    }

    const profile = await NutritionistProfile.findOne({
      userId: appointment.nutritionistId._id,
    });

    res.json({
      hasAppointment: true,
      appointment,
      nutritionistProfile: profile,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get active appointment',
      error: error.message,
    });
  }
});

// يعرض كل أخصائيين التغذية من NutritionistProfile
router.get('/nutritionists', async (req, res) => {
  try {
    const profiles = await NutritionistProfile.find({
      verificationStatus: 'approved'
    }).populate('userId', 'firstName lastName email role');

    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get nutritionists',
      error: error.message,
    });
  }
});

// مواعيد أخصائي حسب نوع الزيارة مع حذف الأوقات المحجوزة
router.get('/availability/:nutritionistId', async (req, res) => {
  try {
    const { visitType } = req.query;

    const filter = {
      nutritionistId: req.params.nutritionistId,
    };

    if (visitType) {
      filter.visitType = visitType;
    }

    const availability = await NutritionistAvailability.find(filter).lean();

    const bookedAppointments = await NutritionistAppointment.find({
      nutritionistId: req.params.nutritionistId,
      status: { $in: ['pending_payment', 'booked'] },
      ...(visitType ? { visitType } : {}),
    }).lean();

    const bookedSet = new Set(
      bookedAppointments.map((app) => `${app.day}-${app.time}`)
    );

    const availableOnly = availability
      .map((item) => {
        const freeSlots = (item.slots || []).filter(
          (slot) => !bookedSet.has(`${item.day}-${slot}`)
        );

        return {
          ...item,
          slots: freeSlots,
        };
      })
      .filter((item) => item.slots.length > 0);

    res.json(availableOnly);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get availability',
      error: error.message,
    });
  }
});

// إنشاء حجز جديد
router.post('/', async (req, res) => {
  try {
    const { patientId, nutritionistId, visitType, day, time } = req.body;

    if (!patientId || !nutritionistId || !visitType || !day || !time) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    if (!['online', 'clinic'].includes(visitType)) {
      return res.status(400).json({
        message: 'visitType must be online or clinic',
      });
    }

    const isOnline = visitType === 'online';

    // المريض ما يكون عنده موعد أخصائي نشط
    const existingPatientAppointment =
      await NutritionistAppointment.findOne({
        patientId,
        status: { $in: ['pending_payment', 'booked'] },
      });

    if (existingPatientAppointment) {
      return res.status(400).json({
        message: 'Patient already has an active nutritionist appointment',
      });
    }

    // الوقت ما يكون مأخوذ
    const slotTaken = await NutritionistAppointment.findOne({
      nutritionistId,
      visitType,
      day,
      time,
      status: { $in: ['pending_payment', 'booked'] },
    });

    if (slotTaken) {
      return res.status(400).json({
        message: 'This slot is already booked',
      });
    }

    let meetingLink = '';
    let googleEventId = '';

    if (isOnline) {
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const meetEvent = await createGoogleMeetEvent({
        summary: 'Nutritionist Online Appointment',
        description: `Online appointment with nutritionist on ${day} at ${time}`,
        startDateTime,
        endDateTime,
        attendees: [],
      });

      meetingLink = meetEvent.meetingLink;
      googleEventId = meetEvent.googleEventId;
    }

    const appointment = await NutritionistAppointment.create({
      patientId,
      nutritionistId,
      visitType,
      day,
      time,
      meetingLink,
      googleEventId,

      // Payment logic
      status: isOnline ? 'pending_payment' : 'booked',
      paymentRequired: isOnline,
      paymentStatus: isOnline ? 'pending' : 'not_required',
      paymentAmount: isOnline ? 10 : 0,
      paymentMethod: '',
      paidAt: null,
    });

    res.status(201).json({
      message: isOnline
        ? 'Nutritionist appointment created. Payment is required.'
        : 'Nutritionist appointment booked successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to book appointment',
      error: error.message,
    });
  }
});

// تعديل موعد
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { visitType, day, time } = req.body;

    if (!visitType || !day || !time) {
      return res.status(400).json({
        message: 'visitType, day and time are required',
      });
    }

    if (!['online', 'clinic'].includes(visitType)) {
      return res.status(400).json({
        message: 'visitType must be online or clinic',
      });
    }

    const appointment = await NutritionistAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      });
    }

    if (appointment.status !== 'booked') {
      return res.status(400).json({
        message: 'Only booked appointments can be updated',
      });
    }

    const slotTaken = await NutritionistAppointment.findOne({
      _id: { $ne: appointmentId },
      nutritionistId: appointment.nutritionistId,
      visitType,
      day,
      time,
      status: { $in: ['pending_payment', 'booked'] },
    });

    if (slotTaken) {
      return res.status(400).json({
        message: 'This slot is already booked',
      });
    }

    appointment.visitType = visitType;
    appointment.day = day;
    appointment.time = time;

    const isOnline = visitType === 'online';

    if (isOnline && !appointment.meetingLink) {
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const meetEvent = await createGoogleMeetEvent({
        summary: 'Nutritionist Online Appointment',
        description: `Online appointment with nutritionist on ${day} at ${time}`,
        startDateTime,
        endDateTime,
        attendees: [],
      });

      appointment.meetingLink = meetEvent.meetingLink;
      appointment.googleEventId = meetEvent.googleEventId;
    }

    if (visitType === 'clinic') {
      appointment.meetingLink = '';
      appointment.googleEventId = '';

      appointment.status = 'booked';
      appointment.paymentRequired = false;
      appointment.paymentStatus = 'not_required';
      appointment.paymentAmount = 0;
      appointment.paymentMethod = '';
      appointment.paidAt = null;
    }

    if (visitType === 'online' && appointment.paymentStatus !== 'paid') {
      appointment.status = 'pending_payment';
      appointment.paymentRequired = true;
      appointment.paymentStatus = 'pending';
      appointment.paymentAmount = 10;
      appointment.paymentMethod = '';
      appointment.paidAt = null;
    }

    await appointment.save();

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update appointment',
      error: error.message,
    });
  }
});

// حذف / إلغاء موعد
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await NutritionistAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to cancel appointment',
      error: error.message,
    });
  }
});

// يعرض كل الحجوزات الخاصة بأخصائي التغذية
router.get('/nutritionist/:nutritionistId', async (req, res) => {
  try {
    const { nutritionistId } = req.params;

    const appointments = await NutritionistAppointment.find({
      nutritionistId,
      status: { $in: ['pending_payment', 'booked'] },
    })
      .populate('patientId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.json({
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get nutritionist appointments',
      error: error.message,
    });
  }
});

module.exports = router;