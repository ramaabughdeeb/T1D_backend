const NutritionItem = require("../models/NutritionItem");

async function getCarbsFromAI(ingredient) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const prompt = `
You are a nutrition calculator.

Estimate carbohydrates for this ingredient:
Name: ${ingredient.name}
Quantity: ${ingredient.quantity}
Unit: ${ingredient.unit}

Return ONLY valid JSON, no markdown, no explanation:
{
  "carbs": 12.5,
  "estimatedCarbsPer100g": 25,
  "gramsUsed": 50
}

Rules:
- carbs is total carbohydrate grams for the given quantity.
- If food has nearly zero carbs, return 0.
- Be reasonable and use common nutrition values.
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Empty AI response");
  }

  let parsed;

  try {
    parsed = JSON.parse(
      text
        .replaceAll("```json", "")
        .replaceAll("```", "")
        .trim()
    );
  } catch (error) {
    throw new Error("AI did not return valid JSON");
  }

  const carbs = Number(parsed.carbs || 0);
  const estimatedCarbsPer100g = Number(parsed.estimatedCarbsPer100g || 0);
  const gramsUsed = parsed.gramsUsed !== undefined ? Number(parsed.gramsUsed) : null;

  if (estimatedCarbsPer100g > 0) {
    const existing = await NutritionItem.findOne({
      $or: [
        { name: String(ingredient.name).toLowerCase().trim() },
        { aliases: String(ingredient.name).toLowerCase().trim() },
      ],
    });

    if (!existing) {
      await NutritionItem.create({
        name: String(ingredient.name).toLowerCase().trim(),
        aliases: [],
        carbsPer100g: estimatedCarbsPer100g,
        commonUnits: [],
        source: "ai",
        verified: false,
      });
    }
  }

  return {
    name: ingredient.name,
    quantity: Number(ingredient.quantity),
    unit: String(ingredient.unit).toLowerCase().trim(),
    gramsUsed: gramsUsed ? Number(gramsUsed.toFixed(1)) : null,
    carbs: Number(carbs.toFixed(1)),
    source: "ai",
  };
}

module.exports = {
  getCarbsFromAI,
};