const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "member"),
      defaultValue: "member",
      allowNull: false,
    },
  },
  {
    tableName: "group_members",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["groupId", "userId"],
      },
    ],
  },
);

module.exports = GroupMember;
