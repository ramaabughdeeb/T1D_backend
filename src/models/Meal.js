const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    gramsUsed: {
      type: Number,
      default: null,
    },

    carbs: {
      type: Number,
      required: true,
      min: 0,
    },

    source: {
      type: String,
      enum: ["database", "ai"],
      default: "database",
    },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "morningSnack", "eveningSnack"],
      required: true,
    },

    mealName: {
      type: String,
      required: true,
      trim: true,
    },

    servingSize: {
      type: String,
      default: "",
      trim: true,
    },

    ingredients: {
      type: [ingredientSchema],
      default: [],
    },

    totalCarbs: {
      type: Number,
      required: true,
      min: 0,
    },

    carbRatio: {
      type: Number,
      default: null,
    },

    insulinUnits: {
      type: Number,
      default: null,
    },

    insulinMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meal", mealSchema);