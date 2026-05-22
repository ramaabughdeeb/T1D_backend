const express = require('express');
const router = express.Router();

const NutritionistMealPlan = require('../models/NutritionistMealPlan');
const NutritionistAppointment = require('../models/NutritionistAppointment');

// Create meal plan
router.post('/', async (req, res) => {
  try {
    const {
      nutritionistId,
      patientId,
      planTitle,
      clinicalGoal,
      startDate,
      endDate,
      glucoseTargets,
      meals,
      dailyTotals,
    } = req.body;

    if (!nutritionistId || !patientId || !planTitle || !startDate || !endDate) {
      return res.status(400).json({
        message:
          'nutritionistId, patientId, planTitle, startDate and endDate are required',
      });
    }

    const hasAppointment = await NutritionistAppointment.findOne({
      nutritionistId,
      patientId,
      status: { $in: ['booked', 'completed'] },
    });

    if (!hasAppointment) {
      return res.status(403).json({
        message: 'This patient is not connected with this nutritionist',
      });
    }

    const plan = await NutritionistMealPlan.create({
      nutritionistId,
      patientId,
      planTitle,
      clinicalGoal,
      startDate,
      endDate,
      glucoseTargets,
      meals,
      dailyTotals,
    });

    return res.status(201).json({
      message: 'Meal plan created successfully',
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create meal plan',
      error: error.message,
    });
  }
});

// Get all plans for nutritionist
router.get('/nutritionist/:nutritionistId', async (req, res) => {
  try {
    const { nutritionistId } = req.params;

    const plans = await NutritionistMealPlan.find({ nutritionistId })
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      plans,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get meal plans',
      error: error.message,
    });
  }
});
// Update meal plan
router.put('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    const {
      nutritionistId,
      patientId,
      planTitle,
      clinicalGoal,
      startDate,
      endDate,
      glucoseTargets,
      meals,
      dailyTotals,
      status,
    } = req.body;

    const updatedPlan = await NutritionistMealPlan.findOneAndUpdate(
      {
        _id: planId,
        nutritionistId,
      },
      {
        patientId,
        planTitle,
        clinicalGoal,
        startDate,
        endDate,
        glucoseTargets,
        meals,
        dailyTotals,
        status,
      },
      { new: true }
    ).populate('patientId', 'firstName lastName email');

    if (!updatedPlan) {
      return res.status(404).json({
        message: 'Meal plan not found',
      });
    }

    return res.status(200).json({
      message: 'Meal plan updated successfully',
      plan: updatedPlan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update meal plan',
      error: error.message,
    });
  }
});

module.exports = router;