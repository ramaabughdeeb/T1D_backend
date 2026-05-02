const mongoose = require('mongoose');

const glucoseReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    value: {
      type: Number,
      required: true,
      min: 20,
      max: 600,
    },

    readingTime: {
      type: Date,
      required: true,
      index: true,
    },

    readingType: {
      type: String,
      enum: ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'],
      default: 'random',
    },

    source: {
      type: String,
      enum: ['manual', 'cgm', 'imported'],
      default: 'manual',
    },

    note: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['low', 'normal', 'high'],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'glucose_readings',
  }
);

function getReadingStatus(value) {
  if (value < 70) return 'low';
  if (value > 180) return 'high';
  return 'normal';
}

glucoseReadingSchema.pre('validate', function (next) {
  if (typeof this.value === 'number') {
    this.status = getReadingStatus(this.value);
  }
  next();
});

glucoseReadingSchema.index({ userId: 1, readingTime: -1 });

module.exports = mongoose.model('GlucoseReading', glucoseReadingSchema);