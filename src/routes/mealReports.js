const express = require("express");
const router = express.Router();

const Meal = require("../models/Meal");

const DAILY_CARB_GOAL = 200;

function getStartDate(filter) {
  const now = new Date();

  if (filter === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (filter === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }

  if (filter === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return null;
}

function getDateKey(date) {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter = "all" } = req.query;

    const query = { userId };

    const startDate = getStartDate(filter);

    if (startDate) {
      query.createdAt = { $gte: startDate };
    }

    const meals = await Meal.find(query).sort({ createdAt: 1 });

    const grouped = {};

    for (const meal of meals) {
      const dateKey = getDateKey(meal.createdAt);

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalCarbs: 0,
          totalInsulin: 0,
          meals: [],
        };
      }

      grouped[dateKey].totalCarbs += Number(meal.totalCarbs || 0);
      grouped[dateKey].totalInsulin += Number(meal.insulinUnits || 0);

      grouped[dateKey].meals.push({
        id: meal._id,
        mealType: meal.mealType,
        mealName: meal.mealName,
        servingSize: meal.servingSize,
        ingredients: meal.ingredients,
        totalCarbs: meal.totalCarbs,
        carbRatio: meal.carbRatio,
        insulinUnits: meal.insulinUnits,
        insulinMessage: meal.insulinMessage,
        createdAt: meal.createdAt,
      });
    }

    const days = Object.values(grouped).map((day) => ({
      ...day,
      totalCarbs: Number(day.totalCarbs.toFixed(1)),
      totalInsulin: Number(day.totalInsulin.toFixed(1)),
    }));

    const totalCarbs = days.reduce((sum, day) => sum + day.totalCarbs, 0);
    const totalInsulin = days.reduce((sum, day) => sum + day.totalInsulin, 0);
    const totalMeals = meals.length;

    const dailyAverage =
      days.length === 0 ? 0 : Number((totalCarbs / days.length).toFixed(1));

    const highestDay =
      days.length === 0
        ? 0
        : Math.max(...days.map((day) => Number(day.totalCarbs || 0)));

    const overGoalDays = days.filter(
      (day) => Number(day.totalCarbs || 0) > DAILY_CARB_GOAL
    ).length;

    return res.json({
      success: true,
      summary: {
        totalCarbs: Number(totalCarbs.toFixed(1)),
        totalInsulin: Number(totalInsulin.toFixed(1)),
        dailyAverage,
        highestDay: Number(highestDay.toFixed(1)),
        overGoalDays,
        totalMeals,
        dailyCarbGoal: DAILY_CARB_GOAL,
      },
      days,
    });
  } catch (error) {
    console.error("Meal report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load meal report",
      error: error.message,
    });
  }
});

module.exports = router;