const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupMessage = sequelize.define(
  "GroupMessage",
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "group_messages",
    timestamps: true,
  },
);

module.exports = GroupMessage;
