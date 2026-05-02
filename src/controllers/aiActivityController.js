exports.analyzeActivityPlan = async (req, res) => {
  try {
    const { activity } = req.body;

    if (!activity) {
      return res.status(400).json({
        message: "Activity data is required",
      });
    }

    const systemPrompt = `
You are a safe diabetes activity assistant.

Your role:
- Suggest light and safe physical activity ideas based on current glucose.
- Explain why an activity is or is not suitable.
- Use simple patient-friendly language.

Strict safety rules:
- Do NOT prescribe insulin doses.
- Do NOT change treatment.
- Do NOT recommend medication changes.
- Do NOT give emergency medical decisions.
- If glucose is low, recommend treating the low and rechecking before activity.
- If glucose is very high, recommend avoiding intense activity and following the care plan or contacting a healthcare professional.
- Return JSON only.

Return exactly this JSON shape:
{
  "riskLevel": "low | medium | high",
  "summary": "",
  "plan": [],
  "safeActivities": [],
  "avoid": [],
  "doctorQuestions": [],
  "warning": ""
}
`;

    const userPrompt = `
Analyze this activity situation:

${JSON.stringify(activity, null, 2)}

Important:
- Suggestions must be light and safe.
- Do not prescribe insulin.
- Do not change treatment.
- Do not give exact medical decisions.
`;

    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      return res.status(500).json({
        message: "AI activity request failed",
        error: text,
      });
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        message: "No AI content returned",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: content,
      });
    }

    return res.json({
      message: "AI activity plan generated successfully",
      ai: parsed,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate AI activity plan",
      error: error.message,
    });
  }
};