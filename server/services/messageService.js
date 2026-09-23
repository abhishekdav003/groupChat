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

module.exports = {
  createMessage,
};
