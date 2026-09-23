require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

require("./models/User");
require("./models/Message");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected");

    await sequelize.sync();

    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

startServer();
