const User = require("./User");
const Group = require("./Group");
const GroupMember = require("./GroupMember");
const GroupMessage = require("./GroupMessage");

Group.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

User.hasMany(Group, {
  foreignKey: "createdBy",
  as: "createdGroups",
});

Group.hasMany(GroupMember, {
  foreignKey: "groupId",
  as: "members",
  onDelete: "CASCADE",
});

GroupMember.belongsTo(Group, {
  foreignKey: "groupId",
});

User.hasMany(GroupMember, {
  foreignKey: "userId",
  as: "groupMemberships",
});

GroupMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Group.hasMany(GroupMessage, {
  foreignKey: "groupId",
  as: "messages",
  onDelete: "CASCADE",
});

GroupMessage.belongsTo(Group, {
  foreignKey: "groupId",
});

User.hasMany(GroupMessage, {
  foreignKey: "userId",
  as: "groupMessages",
});

GroupMessage.belongsTo(User, {
  foreignKey: "userId",
  as: "sender",
});

module.exports = {
  Group,
  GroupMember,
  GroupMessage,
};
