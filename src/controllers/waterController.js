const WaterLog = require('../models/WaterLog');
const PatientProfile = require('../models/PatientProfile');

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function calculateGoalMl(weightKg) {
  return Math.round(Number(weightKg || 0) * 35);
}

exports.getTodayWater = async (req, res) => {
  try {
    const { userId } = req.params;
    const date = req.query.date || todayString();

    const profile = await PatientProfile.findOne({ userId });

    if (!profile || !profile.weight) {
      return res.status(400).json({
        message: 'Patient weight not found',
      });
    }

    const goalMl = calculateGoalMl(profile.weight);

    let log = await WaterLog.findOne({ userId, date });

    if (!log) {
      log = await WaterLog.create({
        userId,
        date,
        amountMl: 0,
        goalMl,
      });
    } else if (log.goalMl !== goalMl) {
      log.goalMl = goalMl;
      await log.save();
    }

    res.json({
      date,
      weightKg: profile.weight,
      amountMl: log.amountMl,
      goalMl: log.goalMl,
      percentage: Math.min(100, Math.round((log.amountMl / log.goalMl) * 100)),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get water data',
      error: error.message,
    });
  }
};

exports.addWater = async (req, res) => {
  try {
    const { userId, amountMl, date } = req.body;

    if (!userId || !amountMl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const weightKg = Number(profile.weightKg || profile.weight || 0);

    if (!weightKg) {
      return res.status(400).json({ message: 'Patient weight not found' });
    }

    const selectedDate = date || new Date().toISOString().split('T')[0];
    const goalMl = Math.round(weightKg * 35);

    const log = await WaterLog.findOneAndUpdate(
      { userId, date: selectedDate },
      {
        $inc: { amountMl: Number(amountMl) },
        $set: { goalMl },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Water saved successfully',
      date: selectedDate,
      amountMl: log.amountMl,
      goalMl: log.goalMl,
      weightKg,
      percentage: Math.min(100, Math.round((log.amountMl / log.goalMl) * 100)),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to save water',
      error: error.message,
    });
  }
};