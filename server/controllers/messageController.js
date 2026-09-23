const messageService = require("../services/messageService");

const { broadcastMessage } = require("../websocket");


const createMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const newMessage = await messageService.createMessage(req.user.id, message);

    const socketMessage = {
      id: newMessage.id,
      userId: newMessage.userId,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
    };

    broadcastMessage(socketMessage);

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await messageService.getMessages();

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createMessage,
  getMessages,
};
