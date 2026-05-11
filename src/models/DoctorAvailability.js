const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema(
  {
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
    slots: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);