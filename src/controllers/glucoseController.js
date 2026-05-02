const GlucoseReading = require('../models/GlucoseReading');
const LowTreatment = require('../models/LowTreatment');
const DeletedGlucoseReading = require('../models/DeletedGlucoseReading');

exports.addReading = async (req, res) => {
  try {
    const { userId, value, readingTime, readingType, source, note } = req.body;

    if (!userId || value === undefined || !readingTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const reading = await GlucoseReading.create({
      userId,
      value,
      readingTime,
      readingType: readingType || 'random',
      source: source || 'manual',
      note: note || '',
    });

    res.status(201).json({
      message: 'Reading saved successfully',
      reading,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to save reading',
      error: error.message,
    });
  }
};

exports.getReadingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    // Hide readings that were previously soft-deleted
    const deletedDocs = await DeletedGlucoseReading.find({ userId })
      .select('readingId')
      .lean();

    const deletedIds = deletedDocs.map((doc) => doc.readingId);

    const filter = {
      userId,
      _id: { $nin: deletedIds },
    };

    if (from || to) {
      filter.readingTime = {};
      if (from) filter.readingTime.$gte = new Date(from);
      if (to) filter.readingTime.$lte = new Date(to);
    }

    const readings = await GlucoseReading.find(filter).sort({ readingTime: 1 });

    res.status(200).json(readings);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch readings',
      error: error.message,
    });
  }
};

exports.getReadingById = async (req, res) => {
  try {
    const { readingId } = req.params;

    const deletedReading = await DeletedGlucoseReading.findOne({
      readingId,
    }).lean();

    if (deletedReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    const reading = await GlucoseReading.findById(readingId).lean();

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    const lowTreatment = await LowTreatment.findOne({ readingId }).lean();

    res.status(200).json({
      ...reading,
      lowTreatment: lowTreatment || null,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch reading',
      error: error.message,
    });
  }
};

// Disabled by design:
// Glucose readings are treated as medical log records.
// We do not update the original time-series reading directly.
exports.updateReading = async (req, res) => {
  return res.status(405).json({
    message:
      'Editing glucose readings is disabled. Add a new reading instead to keep the medical log history.',
  });
};

exports.saveLowTreatment = async (req, res) => {
  try {
    const { readingId } = req.params;

    const {
      type,
      presetKey,
      title,
      subtitle,
      customText,
      reminderEnabled,
    } = req.body;

    const deletedReading = await DeletedGlucoseReading.findOne({
      readingId,
    }).lean();

    if (deletedReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    const reading = await GlucoseReading.findById(readingId).lean();

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    if (reading.value >= 70) {
      return res.status(400).json({
        message: 'Low treatment can only be saved for readings below 70',
      });
    }

    if (!type || !['preset', 'other'].includes(type)) {
      return res.status(400).json({ message: 'Invalid treatment type' });
    }

    if (type === 'preset' && !title) {
      return res.status(400).json({
        message: 'Treatment title is required',
      });
    }

    if (type === 'other' && (!customText || customText.trim() === '')) {
      return res.status(400).json({
        message: 'Custom treatment text is required',
      });
    }

    await LowTreatment.updateOne(
      { readingId },
      {
        $set: {
          readingId,
          userId: reading.userId,
          type,
          presetKey: presetKey || null,
          title: title || '',
          subtitle: subtitle || '',
          customText: customText || '',
          reminderEnabled:
            typeof reminderEnabled === 'boolean' ? reminderEnabled : true,
          treatedAt: new Date(),
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );

    const lowTreatment = await LowTreatment.findOne({ readingId }).lean();

    res.status(200).json({
      message: 'Low treatment saved successfully',
      reading: {
        ...reading,
        lowTreatment,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to save low treatment',
      error: error.message,
    });
  }
};

// Disabled by design:
// We do not physically delete medical readings from the time-series log.
exports.deleteReading = async (req, res) => {
  return res.status(405).json({
    message:
      'Deleting glucose readings is disabled. Readings are kept as part of the medical log history.',
  });
};