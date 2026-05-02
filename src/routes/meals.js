const express = require("express");
const router = express.Router();

const Meal = require("../models/Meal");
const PatientProfile = require("../models/PatientProfile");
const { calculateCarbsFromDatabase } = require("../services/nutritionService");
const { getCarbsFromAI } = require("../services/aiNutritionService");

function validateIngredients(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return "Ingredients are required";
  }

  for (const ing of ingredients) {
    if (!ing.name || !String(ing.name).trim()) {
      return "Ingredient name is required";
    }

    if (ing.quantity === undefined || Number(ing.quantity) <= 0) {
      return `Invalid quantity for ${ing.name}`;
    }

    if (!ing.unit || !String(ing.unit).trim()) {
      return `Unit is required for ${ing.name}`;
    }
  }

  return null;
}

async function calculateIngredient(ingredient) {
  const fromDb = await calculateCarbsFromDatabase(ingredient);

  if (fromDb) {
    return fromDb;
  }

  const fromAi = await getCarbsFromAI(ingredient);
  return fromAi;
}

function calculateInsulin(totalCarbs, carbRatio) {
  if (!carbRatio || Number(carbRatio) <= 0) {
    return {
      insulinUnits: null,
      insulinMessage: "No carb ratio found. Please consult your doctor.",
    };
  }

  const insulinUnits = Math.round(totalCarbs / Number(carbRatio));

  return {
    insulinUnits,
    insulinMessage: "",
  };
}

// Calculate only, without saving
router.post("/calculate", async (req, res) => {
  try {
    const { userId, mealType, mealName, servingSize, ingredients } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const validationError = validateIngredients(ingredients);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const patientProfile = await PatientProfile.findOne({ userId });
    const carbRatio = patientProfile?.carbRatio || null;

    const calculatedIngredients = [];

    for (const ingredient of ingredients) {
      const calculated = await calculateIngredient(ingredient);
      calculatedIngredients.push(calculated);
    }

    const totalCarbs = Number(
      calculatedIngredients
        .reduce((sum, ing) => sum + Number(ing.carbs || 0), 0)
        .toFixed(1)
    );

    const insulinResult = calculateInsulin(totalCarbs, carbRatio);

    return res.json({
      success: true,
      meal: {
        mealType,
        mealName: mealName || "Unnamed meal",
        servingSize: servingSize || "",
        ingredients: calculatedIngredients,
        totalCarbs,
        carbRatio,
        insulinUnits: insulinResult.insulinUnits,
        insulinMessage: insulinResult.insulinMessage,
      },
    });
  } catch (error) {
    console.error("Calculate meal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate meal",
      error: error.message,
    });
  }
});

// Save meal after calculation
router.post("/", async (req, res) => {
  try {
    const {
      mealType,
      userId,
      mealName,
      servingSize,
      ingredients,
      totalCarbs,
      carbRatio,
      insulinUnits,
      insulinMessage,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }
    if (!mealType) {
  return res.status(400).json({
    success: false,
    message: "mealType is required",
  });
}
    if (!mealType) {
  return res.status(400).json({
    success: false,
    message: "mealType is required",
  });
}

    if (!mealName || !String(mealName).trim()) {
      return res.status(400).json({
        success: false,
        message: "mealName is required",
      });
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ingredients are required",
      });
    }

    const savedMeal = await Meal.create({
      userId,
      mealType,
      mealName,
      servingSize: servingSize || "",
      ingredients,
      totalCarbs,
      carbRatio: carbRatio || null,
      insulinUnits: insulinUnits ?? null,
      insulinMessage: insulinMessage || "",
    });

    return res.status(201).json({
      success: true,
      message: "Meal saved successfully",
      meal: savedMeal,
    });
  } catch (error) {
    console.error("Save meal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save meal",
      error: error.message,
    });
  }
});

// Get saved meals for user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { mealType } = req.query;

    const filter = { userId };

    if (mealType) {
      filter.mealType = mealType;
    }

    const meals = await Meal.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      meals,
    });
  } catch (error) {
    console.error("Get meals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get saved meals",
      error: error.message,
    });
  }
});

// Delete meal
router.delete("/:mealId", async (req, res) => {
  try {
    const { mealId } = req.params;

    const deleted = await Meal.findByIdAndDelete(mealId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Meal not found",
      });
    }

    return res.json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error("Delete meal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete meal",
      error: error.message,
    });
  }
});

module.exports = router;