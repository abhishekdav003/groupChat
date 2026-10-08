const PersonalMessage = require("../models/PersonalMessage");

const getPersonalMessages = async (roomId) => {
  const messages = await PersonalMessage.findAll({
    where: {
      roomId,
    },
    order: [["createdAt", "ASC"]],
  });

  return messages;
};

module.exports = {
  getPersonalMessages,
};
