const NutritionItem = require("../models/NutritionItem");

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .trim();
}

function normalizeUnit(unit) {
  return String(unit || "")
    .toLowerCase()
    .trim();
}

function calculateGrams(quantity, unit, item) {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === "g" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return quantity;
  }

  const matchedUnit = item.commonUnits.find(
    (u) => normalizeUnit(u.unit) === normalizedUnit
  );

  if (!matchedUnit) {
    return null;
  }

  return quantity * matchedUnit.grams;
}

async function findNutritionItem(ingredientName) {
  const name = normalizeName(ingredientName);

  return NutritionItem.findOne({
    $or: [
      { name },
      { aliases: name },
    ],
  });
}

async function calculateCarbsFromDatabase(ingredient) {
  const item = await findNutritionItem(ingredient.name);

  if (!item) {
    return null;
  }

  const quantity = Number(ingredient.quantity);
  const unit = normalizeUnit(ingredient.unit);

  if (!quantity || quantity <= 0) {
    throw new Error(`Invalid quantity for ${ingredient.name}`);
  }

  const gramsUsed = calculateGrams(quantity, unit, item);

  if (gramsUsed === null) {
    return null;
  }

  const carbs = (gramsUsed * item.carbsPer100g) / 100;

  return {
    name: ingredient.name,
    quantity,
    unit,
    gramsUsed: Number(gramsUsed.toFixed(1)),
    carbs: Number(carbs.toFixed(1)),
    source: "database",
  };
}

module.exports = {
  calculateCarbsFromDatabase,
};