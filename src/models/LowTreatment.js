const mongoose = require('mongoose');

const lowTreatmentSchema = new mongoose.Schema(
  {
    readingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GlucoseReading',
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['preset', 'other'],
      required: true,
    },

    presetKey: {
      type: String,
      default: null,
      trim: true,
    },

    title: {
      type: String,
      default: '',
      trim: true,
    },

    subtitle: {
      type: String,
      default: '',
      trim: true,
    },

    customText: {
      type: String,
      default: '',
      trim: true,
    },

    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    treatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'low_treatments',
  }
);

module.exports = mongoose.model('LowTreatment', lowTreatmentSchema);