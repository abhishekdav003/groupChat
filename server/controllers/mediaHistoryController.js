const mediaHistoryService = require("../services/mediaHistoryService");

const getMediaHistory = async (req, res) => {
  try {
    const { chatType, chatId } = req.query;

    if (!chatType || !chatId) {
      return res.status(400).json({
        message: "chatType and chatId are required",
      });
    }

    const history = await mediaHistoryService.getMediaHistory(
      chatType,
      chatId,
      req.user.id,
    );

    return res.status(200).json({
      message: "Media history fetched successfully",
      data: history,
    });
  } catch (error) {
    const statusCode =
      error.message === "Access denied" ||
      error.message === "You are not a member of this group"
        ? 403
        : error.message === "Invalid chat type" ||
            error.message === "Invalid general chat ID" ||
            error.message === "Invalid group ID" ||
            error.message === "Chat ID is required"
          ? 400
          : 500;

    console.error("Get media history error:", error.message);

    return res.status(statusCode).json({
      message:
        statusCode === 500 ? "Failed to fetch media history" : error.message,
    });
  }
};

module.exports = { getMediaHistory };
