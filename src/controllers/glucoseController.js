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
      carbsNeeded,
      selectedCarbs,
      imageUrl,
      imageQuery,
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
  imageUrl: imageUrl || '',
  imageQuery: imageQuery || '',
  reminderEnabled:
    typeof reminderEnabled === 'boolean' ? reminderEnabled : true,
  carbsNeeded: Number(carbsNeeded) || 0,
  selectedCarbs: Number(selectedCarbs) || 0,
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

exports.getLowTreatmentSuggestions = async (req, res) => {
  try {
    const { carbsNeeded, weight } = req.body;

    if (!carbsNeeded) {
      return res.status(400).json({
        message: 'carbsNeeded is required',
      });
    }

    const targetCarbs = Number(carbsNeeded) || 15;

    const prompt = `
You are helping a Type 1 diabetes patient treat low blood glucose.

The patient needs exactly about ${targetCarbs} grams of FAST-ACTING carbohydrates.
Patient weight: ${weight || 'unknown'} kg.

Give exactly 6 SIMPLE fast-acting carbohydrate options.

Rules:
- Return ONLY valid JSON array.
- No markdown.
- No explanation.
- Do NOT include meals, recipes, steps, insulin, calories, or ingredients.
- Do NOT suggest chocolate, cake, peanut butter, nuts, fried food, milk, yogurt, or fatty foods.
- Each option must be close to ${targetCarbs}g carbs.
- Use simple emergency low-glucose options only.
- No duplicate items.
- amount must be a short practical amount like "180 ml", "5 tablets", "1 tbsp".

Return exactly this JSON shape:
[
  {
    "title": "Apple Juice",
    "amount": "180 ml",
    "carbs": ${targetCarbs},
    "image_query": "apple juice"
  }
]
`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        message: 'AI failed to return suggestions',
        details: data,
      });
    }

    let suggestions;

    try {
      suggestions = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({
        message: 'AI returned invalid JSON',
        raw: content,
      });
    }

    if (!Array.isArray(suggestions)) {
      return res.status(500).json({
        message: 'AI response is not an array',
        raw: suggestions,
      });
    }

    suggestions = suggestions
      .filter((item) => item && item.title && item.amount)
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        amount: item.amount,
        carbs: Number(item.carbs) || targetCarbs,
        image_query: item.image_query || item.title,
      }));

    res.status(200).json({
      suggestions,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate suggestions',
      error: error.message,
    });
  }
};

exports.deleteReading = async (req, res) => {
  return res.status(405).json({
    message:
      'Deleting glucose readings is disabled. Readings are kept as part of the medical log history.',
  });
};