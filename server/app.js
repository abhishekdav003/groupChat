const express = require('express')
const cors = require('cors')
const app = express()
const authRoutes = require("./routes/authRoutes")
const messageRoutes = require("./routes/messageRoutes");

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({
    message:"Hello"
  })
})

module.exports = app