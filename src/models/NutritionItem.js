const mongoose = require("mongoose");

const commonUnitSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    grams: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const nutritionItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    aliases: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    carbsPer100g: {
      type: Number,
      required: true,
      min: 0,
    },

    commonUnits: [commonUnitSchema],

    source: {
      type: String,
      enum: ["database", "ai"],
      default: "database",
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

nutritionItemSchema.index({ name: 1 });
nutritionItemSchema.index({ aliases: 1 });

module.exports = mongoose.model("NutritionItem", nutritionItemSchema);