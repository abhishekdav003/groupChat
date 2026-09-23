const express = require('express')
const cors = require('cors')
const app = express()
const authRoutes = require("./routes/authRoutes")

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
  res.json({
    message:"Hello"
  })
})

module.exports = app