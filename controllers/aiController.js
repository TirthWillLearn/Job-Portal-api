const genAI = require("../utils/gemini");

exports.generateJobDescription = async (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ summary: text });
  } catch (err) {
    next(err);
  }
};
