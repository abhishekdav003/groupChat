const Message = require("../models/Message");

const createMessage = async (userId, message) => {
  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const newMessage = await Message.create({
    userId,
    message: message.trim(),
  });

  return newMessage;
};

const getMessages = async () => {
  const messages = await Message.findAll({
    include: [
      {
        model: require("../models/User"),
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return messages;
};

module.exports = {
  createMessage,
  getMessages,
};
