const mongoose = require('mongoose');

const nutritionistAppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    nutritionistId: {
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
      enum: ['pending_payment', 'booked', 'cancelled', 'completed'],
      default: 'booked',
    },

    // Payment fields
    paymentRequired: {
      type: Boolean,
      default: false,
    },

    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'paid', 'failed'],
      default: 'not_required',
    },

    paymentAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      default: '',
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'NutritionistAppointment',
  nutritionistAppointmentSchema
);