const {
  getPredictiveSuggestions: generatePredictiveSuggestions,
  getSmartReplies: generateSmartReplies,
} = require("../services/geminiService");

const getPredictiveSuggestions = async (req, res) => {
  try {
    const { text, recentMessages = [], style = "casual" } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message draft is required",
      });
    }

    const suggestions = await generatePredictiveSuggestions(
      text.trim().slice(0, 1000),
      Array.isArray(recentMessages) ? recentMessages.slice(-5) : [],
      style,
    );

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Predictive suggestions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate suggestions",
    });
  }
};

const getSmartReplies = async (req, res) => {
  try {
    const { incomingMessage, recentMessages = [], style = "casual" } = req.body;

    if (typeof incomingMessage !== "string" || !incomingMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: "Incoming message is required",
      });
    }

    const replies = await generateSmartReplies(
      incomingMessage.trim().slice(0, 1000),
      Array.isArray(recentMessages) ? recentMessages.slice(-5) : [],
      style,
    );

    return res.status(200).json({
      success: true,
      replies,
    });
  } catch (error) {
    console.error("Smart replies error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate smart replies",
    });
  }
};

module.exports = {
  getPredictiveSuggestions,
  getSmartReplies,
};
