require("dotenv").config()
const app = require("./app")
const sequelize = require("./config/database")
require("./models/User")


const PORT = 4000 || process.env.PORT

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log("Database connected")

    await sequelize.sync()

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch(error) {
    console.log("database connection failed", error.message)
}
}

startServer()