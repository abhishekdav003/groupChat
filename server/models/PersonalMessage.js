const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PersonalMessage = sequelize.define(
  "PersonalMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    roomId: {
      type: DataTypes.STRING,
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
    tableName: "personal_messages",
    timestamps: true,
  },
);

module.exports = PersonalMessage;
