const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true, // yyyy-mm-dd
      index: true,
    },

    amountMl: {
      type: Number,
      default: 0,
    },

    goalMl: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WaterLog', waterLogSchema);