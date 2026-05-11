const mongoose = require('mongoose');

const nutritionistAvailabilitySchema = new mongoose.Schema(
  {
    nutritionistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    day: {
      type: String,
      required: true,
    },
    visitType: {
      type: String,
      enum: ['online', 'clinic'],
      required: true,
    },
    slots: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'NutritionistAvailability',
  nutritionistAvailabilitySchema
);