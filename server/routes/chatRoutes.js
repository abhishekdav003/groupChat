const express = require("express");

const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/room", authMiddleware, chatController.createPersonalRoom);

router.get(
  "/messages/:roomId",
  authMiddleware,
  chatController.getPersonalMessages,
);

module.exports = router;
