exports.analyzeGlucoseReport = async (req, res) => {
  try {
    const { report } = req.body;

    if (!report) {
      return res.status(400).json({ message: 'Report data is required' });
    }

    const systemPrompt = `
You are a diabetes report assistant.

Your role:
- Explain glucose patterns in simple patient-friendly language.
- Identify possible patterns such as repeated highs, repeated lows, unstable periods, or good stability.
- Suggest safe non-medical actions such as rechecking, tracking meals, or discussing patterns with a doctor.

Strict safety rules:
- Do NOT prescribe insulin doses.
- Do NOT change treatment plans.
- Do NOT tell the patient to stop or start medication.
- Do NOT make emergency decisions.
- If data suggests frequent severe highs/lows, recommend contacting a healthcare professional.
- Return JSON only.

Return exactly this JSON shape:
{
  "summary": "",
  "riskLevel": "low | medium | high",
  "patterns": [],
  "safeSuggestions": [],
  "doctorQuestions": [],
  "warning": ""
}
`;

    const userPrompt = `
Analyze this glucose report:

${JSON.stringify(report, null, 2)}

Important:
- Estimated A1C is only an estimate from glucose readings.
- It is not a lab HbA1c result.
- Do not recommend doses or treatment changes.
`;

    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      return res.status(500).json({
        message: 'AI request failed',
        error: text,
      });
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        message: 'No AI content returned',
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({
        message: 'AI returned invalid JSON',
        raw: content,
      });
    }

    return res.json({
      message: 'AI report generated successfully',
      ai: parsed,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to generate AI report',
      error: error.message,
    });
  }
};