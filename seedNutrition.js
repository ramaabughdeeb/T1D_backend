require("dotenv").config();
const mongoose = require("mongoose");
const NutritionItem = require("./src/models/NutritionItem");

const items = [
  {
    name: "rice",
    aliases: ["رز", "أرز", "cooked rice"],
    carbsPer100g: 28,
    commonUnits: [
      { unit: "cup", grams: 158 },
      { unit: "tbsp", grams: 10 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "potato",
    aliases: ["بطاطا", "بطاطس"],
    carbsPer100g: 17,
    commonUnits: [
      { unit: "piece", grams: 150 },
      { unit: "cup", grams: 150 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "bread",
    aliases: ["خبز", "pita bread"],
    carbsPer100g: 49,
    commonUnits: [
      { unit: "slice", grams: 30 },
      { unit: "piece", grams: 60 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "chicken",
    aliases: ["دجاج"],
    carbsPer100g: 0,
    commonUnits: [
      { unit: "piece", grams: 100 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "eggplant",
    aliases: ["باذنجان"],
    carbsPer100g: 6,
    commonUnits: [
      { unit: "cup", grams: 80 },
      { unit: "piece", grams: 300 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "yogurt",
    aliases: ["لبن", "زبادي"],
    carbsPer100g: 4.7,
    commonUnits: [
      { unit: "cup", grams: 245 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "banana",
    aliases: ["موز"],
    carbsPer100g: 23,
    commonUnits: [
      { unit: "piece", grams: 118 },
    ],
    source: "database",
    verified: true,
  },
  {
    name: "apple",
    aliases: ["تفاح"],
    carbsPer100g: 14,
    commonUnits: [
      { unit: "piece", grams: 180 },
    ],
    source: "database",
    verified: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    for (const item of items) {
      await NutritionItem.findOneAndUpdate(
        { name: item.name },
        item,
        { upsert: true, new: true }
      );
    }

    console.log("Nutrition items seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();