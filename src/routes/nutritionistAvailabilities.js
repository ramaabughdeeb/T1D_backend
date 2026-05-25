const express = require('express');
const router = express.Router();

const NutritionistAvailability = require('../models/NutritionistAvailability');

// Save multiple days
router.post('/bulk', async (req, res) => {
  try {
    const { nutritionistId, schedules } = req.body;

    if (!nutritionistId || !Array.isArray(schedules)) {
      return res.status(400).json({
        message: 'nutritionistId and schedules are required',
      });
    }

    const savedSchedules = [];

    for (const schedule of schedules) {
      const { day, visitType, slots } = schedule;

      if (!day || !visitType || !Array.isArray(slots)) {
        continue;
      }

      const saved = await NutritionistAvailability.findOneAndUpdate(
        {
          nutritionistId,
          day,
          visitType,
        },
        {
          nutritionistId,
          day,
          visitType,
          slots,
        },
        {
          new: true,
          upsert: true,
        }
      );

      savedSchedules.push(saved);
    }

    return res.status(200).json({
      message: 'Availabilities saved successfully',
      schedules: savedSchedules,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save availabilities',
      error: error.message,
    });
  }
});

// Get nutritionist availabilities
router.get('/nutritionist/:nutritionistId', async (req, res) => {
  try {
    const { nutritionistId } = req.params;

    const availabilities = await NutritionistAvailability.find({
      nutritionistId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      availabilities,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get availabilities',
      error: error.message,
    });
  }
});
// Delete availability
router.delete('/:availabilityId', async (req, res) => {
  try {
    const { availabilityId } = req.params;

    const deleted = await NutritionistAvailability.findByIdAndDelete(
      availabilityId
    );

    if (!deleted) {
      return res.status(404).json({
        message: 'Availability not found',
      });
    }

    return res.status(200).json({
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete availability',
      error: error.message,
    });
  }
});
module.exports = router;