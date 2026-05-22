const mongoose = require('mongoose');

const doctorAppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    visitType: {
      type: String,
      enum: ['online', 'clinic'],
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    meetingLink: {
      type: String,
      default: '',
    },
    googleEventId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled', 'completed'],
      default: 'booked',
    },
    startTime: {
  type: String,
  default: '',
},
endTime: {
  type: String,
  default: '',
},
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorAppointment', doctorAppointmentSchema);