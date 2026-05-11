const express = require('express');
const router = express.Router();

const DoctorAppointment = require('../models/DoctorAppointment');
const DoctorAvailability = require('../models/DoctorAvailability');
const DoctorProfile = require('../models/DoctorProfile');

const {
  createGoogleMeetEvent,
} = require('../services/googleCalendarService');

// يفحص إذا المريض عنده حجز نشط مع طبيب
router.get('/active/:patientId', async (req, res) => {
  try {
    const appointment = await DoctorAppointment.findOne({
      patientId: req.params.patientId,
      status: 'booked',
    }).populate('doctorId', 'firstName lastName email role');

    if (!appointment) {
      return res.json({ hasAppointment: false });
    }

    const profile = await DoctorProfile.findOne({
      userId: appointment.doctorId._id,
    });

    res.json({
      hasAppointment: true,
      appointment,
      doctorProfile: profile,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get active doctor appointment',
      error: error.message,
    });
  }
});

// يعرض الأطباء
router.get('/doctors', async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({
      verificationStatus: 'pending',
    }).populate('userId', 'firstName lastName email role');

    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get doctors',
      error: error.message,
    });
  }
});

// مواعيد الطبيب مع إخفاء المحجوز
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { visitType } = req.query;

    const filter = {
      doctorId: req.params.doctorId,
    };

    if (visitType) {
      filter.visitType = visitType;
    }

    const availability = await DoctorAvailability.find(filter).lean();

    const bookedAppointments = await DoctorAppointment.find({
      doctorId: req.params.doctorId,
      status: 'booked',
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
      message: 'Failed to get doctor availability',
      error: error.message,
    });
  }
});

// إنشاء حجز طبيب
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, visitType, day, time } = req.body;

    if (!patientId || !doctorId || !visitType || !day || !time) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    const existingPatientAppointment = await DoctorAppointment.findOne({
      patientId,
      status: 'booked',
    });

    if (existingPatientAppointment) {
      return res.status(400).json({
        message: 'Patient already has an active doctor appointment',
      });
    }

    const slotTaken = await DoctorAppointment.findOne({
      doctorId,
      visitType,
      day,
      time,
      status: 'booked',
    });

    if (slotTaken) {
      return res.status(400).json({
        message: 'This slot is already booked',
      });
    }

    let meetingLink = '';
    let googleEventId = '';

    if (visitType === 'online') {
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const meetEvent = await createGoogleMeetEvent({
        summary: 'Doctor Online Appointment',
        description: `Online appointment with doctor on ${day} at ${time}`,
        startDateTime,
        endDateTime,
        attendees: [],
      });

      meetingLink = meetEvent.meetingLink;
      googleEventId = meetEvent.googleEventId;
    }

    const appointment = await DoctorAppointment.create({
      patientId,
      doctorId,
      visitType,
      day,
      time,
      meetingLink,
      googleEventId,
    });

    res.status(201).json({
      message: 'Doctor appointment booked successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to book doctor appointment',
      error: error.message,
    });
  }
});

// تعديل موعد طبيب
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { visitType, day, time } = req.body;

    if (!visitType || !day || !time) {
      return res.status(400).json({
        message: 'visitType, day and time are required',
      });
    }

    const appointment = await DoctorAppointment.findById(appointmentId);

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

    const slotTaken = await DoctorAppointment.findOne({
      _id: { $ne: appointmentId },
      doctorId: appointment.doctorId,
      visitType,
      day,
      time,
      status: 'booked',
    });

    if (slotTaken) {
      return res.status(400).json({
        message: 'This slot is already booked',
      });
    }

    appointment.visitType = visitType;
    appointment.day = day;
    appointment.time = time;

    await appointment.save();

    res.json({
      message: 'Doctor appointment updated successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update doctor appointment',
      error: error.message,
    });
  }
});

// إلغاء موعد طبيب
router.delete('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await DoctorAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      message: 'Doctor appointment cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to cancel doctor appointment',
      error: error.message,
    });
  }
});

module.exports = router;