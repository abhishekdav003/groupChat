
const groupMessageService = require("../services/groupMessageService");

const getGroupMessages = async (req, res) => {
  try {
    const messages = await groupMessageService.getGroupMessages(
      req.params.groupId,
      req.user.id
    );

    res.status(200).json({
      message: "Group messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    const statusCode =
      error.message === "You are not a member of this group"
        ? 403
        : 500;

    res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  getGroupMessages,
};
