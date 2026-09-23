const express = require("express");

const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, messageController.createMessage);

router.get("/", authMiddleware, messageController.getMessages);

module.exports = router;
