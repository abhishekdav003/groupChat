
const GroupMember = require("../models/GroupMember");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/User");

const checkMembership = async (groupId, userId) => {
  const member = await GroupMember.findOne({
    where: { groupId, userId },
  });

  return member;
};

const getGroupMessages = async (groupId, userId) => {
  const member = await checkMembership(groupId, userId);

  if (!member) {
    throw new Error("You are not a member of this group");
  }

  return GroupMessage.findAll({
    where: { groupId },
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

const saveGroupMessage = async (groupId, userId, message) => {
  const member = await checkMembership(groupId, userId);

  if (!member) {
    throw new Error("You are not a member of this group");
  }

  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  return GroupMessage.create({
    groupId,
    userId,
    message: message.trim(),
  });
};

module.exports = {
  getGroupMessages,
  saveGroupMessage,
};