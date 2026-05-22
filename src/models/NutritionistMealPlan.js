const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema(
  {
    foodItems: {
      type: String,
      default: '',
    },
    calories: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const nutritionistMealPlanSchema = new mongoose.Schema(
  {
    nutritionistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planTitle: {
      type: String,
      required: true,
      trim: true,
    },
    clinicalGoal: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    glucoseTargets: {
      fasting: {
        type: String,
        default: '80–130',
      },
      postMeal: {
        type: String,
        default: '< 180',
      },
      hba1cTarget: {
        type: String,
        default: '< 7.0',
      },
    },
    meals: {
      breakfast: mealItemSchema,
      lunch: mealItemSchema,
      dinner: mealItemSchema,
      snack: mealItemSchema,
    },
    dailyTotals: {
      calories: {
        type: Number,
        default: 0,
      },
      carbs: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
 
    },
    status: {
      type: String,
      enum: ['active', 'review', 'done'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'NutritionistMealPlan',
  nutritionistMealPlanSchema
);