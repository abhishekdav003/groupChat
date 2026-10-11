require("dotenv").config();

const http = require("http");

const app = require("./app");
const sequelize = require("./config/database");
const { createWebSocketServer } = require("./websocket");
const createPersonalChatServer = require("./personalChatSocket");

require("./models/User");
require("./models/Message");
require("./models/PersonalMessage");
require("./models/Group");
require("./models/GroupMember");
require("./models/GroupMessage");
require("./models/associations");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected");

    await sequelize.sync();

    console.log("Database synced");

    const server = http.createServer(app);

    createWebSocketServer(server);
    createPersonalChatServer(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

startServer();
