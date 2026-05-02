const express = require('express');
const router = express.Router();

const PatientProfile = require('../models/PatientProfile');

router.post('/suggest-meals', async (req, res) => {
  try {
    const { userId, mealType, userNote } = req.body;

    if (!userId || !mealType) {
      return res.status(400).json({
        message: 'userId and mealType are required',
      });
    }

    const patient = await PatientProfile.findOne({ userId });

    if (!patient) {
      return res.status(404).json({
        message: 'Patient profile not found',
      });
    }

    const carbRatio =
      patient.carbRatio !== undefined &&
      patient.carbRatio !== null &&
      patient.carbRatio !== ''
        ? Number(patient.carbRatio)
        : null;

    const hasValidCarbRatio =
      carbRatio !== null && !Number.isNaN(carbRatio) && carbRatio > 0;

    let allergiesText = 'No known allergies';

    if (patient.hasAllergies === true && patient.allergyDetails) {
      allergiesText = patient.allergyDetails;
    } else if (patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0) {
      allergiesText = patient.allergies.join(', ');
    } else if (patient.allergyDetails) {
      allergiesText = patient.allergyDetails;
    }

    const systemPrompt = `
You are a clinical dietitian specializing in Type 1 diabetes management.

Reply ONLY with valid JSON.
Do not write markdown.
Do not write explanations outside JSON.

Very important rules:
1. Suggest exactly 6 meals.
2. The meals must match the requested meal type.
3. Avoid all patient allergies completely.
4. Keep meals suitable for Type 1 diabetes.
5. Provide realistic estimated carbohydrates in grams.
6. Provide realistic estimated calories.
7. Do not calculate insulin units. Always return insulin_units as null.
8. The server will calculate insulin units using the patient's saved carb ratio.
9. If allergies are provided, do not include any ingredient related to those allergies.
10. Always include a safe insulin note reminding the patient to consult their doctor.

Required JSON schema:
{
  "meals": [
    {
      "name": "string",
      "description": "1-2 sentences",
      "carbs": number,
      "insulin_units": null,
      "calories": number,
      "image_query": "short English phrase for food photo search",
      "ingredients": [
        {
          "name": "string",
          "quantity": "string"
        }
      ],
      "steps": ["string"],
      "insulin_note": "string"
    }
  ]
}
`;

    const userPrompt = `
Meal type:
${mealType}

Patient saved profile:
- Management type: ${patient.managementType || 'not provided'}
- Allergies: ${allergiesText}
- Carb ratio: ${
      hasValidCarbRatio
        ? `1 unit of insulin for every ${carbRatio} grams of carbohydrates`
        : 'not saved'
    }

User temporary note:
${userNote || 'none'}

Task:
Suggest exactly 9 ${mealType} meals based on the patient's saved profile.

Meal rules:
- Avoid the allergies listed above.
- Do not ask the patient about allergies.
- Do not ask the patient about carb ratio.
- Use only the saved patient profile.
- Each meal should have 4 to 6 ingredients.
- Each meal should have 3 to 5 preparation steps.
- insulin_units must be null in your JSON because the server calculates it.
`;

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.6,
          max_tokens: 3000,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();

      return res.status(500).json({
        message: 'Groq API error',
        error: errorText,
      });
    }

    const groqData = await groqResponse.json();

    let aiText = groqData.choices?.[0]?.message?.content || '';

    aiText = aiText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(aiText);
    } catch (parseError) {
      return res.status(500).json({
        message: 'AI returned invalid JSON',
        rawResponse: aiText,
      });
    }

    const mealsFromAI = Array.isArray(parsed.meals) ? parsed.meals : [];

    const meals = mealsFromAI.map((meal) => {
      const carbs = Number(meal.carbs || 0);

      const insulinUnits = hasValidCarbRatio
  ? Math.round(carbs / carbRatio)
  : null;
      return {
        name: meal.name || '',
        description: meal.description || '',
        carbs,
        insulin_units: insulinUnits,
        calories: Number(meal.calories || 0),
        image_query: meal.image_query || meal.name || 'healthy meal',
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        steps: Array.isArray(meal.steps) ? meal.steps : [],
        insulin_note: hasValidCarbRatio
          ? `Estimated insulin units are calculated using your saved carb ratio: 1 unit for every ${carbRatio}g carbs. Please confirm with your doctor before using any dose.`
          : 'Insulin units cannot be calculated because your carb ratio is not saved. Please consult your doctor.',
      };
    });

    return res.status(200).json({
      meals,
    });
  } catch (error) {
    console.error('AI meal suggestion error:', error);

    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;