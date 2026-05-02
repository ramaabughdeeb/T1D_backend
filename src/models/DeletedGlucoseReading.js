const mongoose = require('mongoose');

const deletedGlucoseReadingSchema = new mongoose.Schema(
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
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'deleted_glucose_readings',
  }
);

module.exports = mongoose.model(
  'DeletedGlucoseReading',
  deletedGlucoseReadingSchema
);