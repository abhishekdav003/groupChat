const express = require("express");
const router = express.Router();

const {
  getPredictiveSuggestions,
  getSmartReplies,
} = require("../controllers/aiController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/predictive", authMiddleware, getPredictiveSuggestions);

router.post("/smart-replies", authMiddleware, getSmartReplies);

module.exports = router;
