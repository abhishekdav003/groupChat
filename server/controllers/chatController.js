const createRoomId = require("../utils/roomId");

const personalMessageService = require("../services/personalMessageService");

const getPersonalMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await personalMessageService.getPersonalMessages(roomId);

    res.status(200).json({
      message: "Personal messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get personal messages error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const createPersonalRoom = (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({
        message: "You cannot create a chat with yourself",
      });
    }

    const roomId = createRoomId(req.user.id, Number(userId));

    res.status(200).json({
      message: "Room created",
      roomId,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};



module.exports = {
  createPersonalRoom,
  getPersonalMessages,
};