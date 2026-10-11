
const express = require("express");

const chatController = require("../controllers/chatController");
const groupController = require("../controllers/groupController");
const authMiddleware = require("../middlewares/authMiddleware");
const groupMessageController = require("../controllers/groupMessageController");

const router = express.Router();

// Existing personal chat routes
router.post(
  "/room",
  authMiddleware,
  chatController.createPersonalRoom
);

router.get(
  "/messages/:roomId",
  authMiddleware,
  chatController.getPersonalMessages
);

// New group routes
router.post(
  "/groups",
  authMiddleware,
  groupController.createGroup
);

router.get(
  "/groups",
  authMiddleware,
  groupController.getUserGroups
);

router.post(
  "/groups/:groupId/members",
  authMiddleware,
  groupController.addMember
);

router.get(
  "/groups/:groupId/messages",
  authMiddleware,
  groupMessageController.getGroupMessages,
);

module.exports = router;
