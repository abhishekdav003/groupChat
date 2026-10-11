
const { Group, GroupMember } = require("../models/associations");
const User = require("../models/User");
const sequelize = require("../config/database");

const createGroup = async (name, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const group = await Group.create(
      {
        name: name.trim(),
        createdBy: userId,
      },
      { transaction }
    );

    await GroupMember.create(
      {
        groupId: group.id,
        userId,
        role: "admin",
      },
      { transaction }
    );

    await transaction.commit();

    return group;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getUserGroups = async (userId) => {
  const memberships = await GroupMember.findAll({
    where: { userId },
    include: [
      {
        model: Group,
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return memberships.map((item) => item.Group);
};

const addMember = async (groupId, email, requesterId) => {
  const group = await Group.findByPk(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  const requester = await GroupMember.findOne({
    where: {
      groupId,
      userId: requesterId,
      role: "admin",
    },
  });

  if (!requester) {
    throw new Error("Only group admins can add members");
  }

  const user = await User.findOne({
    where: { email: email.trim() },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingMember = await GroupMember.findOne({
    where: {
      groupId,
      userId: user.id,
    },
  });

  if (existingMember) {
    throw new Error("User is already a group member");
  }

  return GroupMember.create({
    groupId,
    userId: user.id,
    role: "member",
  });
};

module.exports = {
  createGroup,
  getUserGroups,
  addMember,
};

