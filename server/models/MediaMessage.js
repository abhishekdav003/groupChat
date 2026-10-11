const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MediaMessage = sequelize.define(
  "MediaMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chatType: {
      type: DataTypes.ENUM("general", "personal", "group"),
      allowNull: false,
    },
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fileKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: "media_messages",
    timestamps: true,
  },
);

module.exports = MediaMessage;
