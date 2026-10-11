
const express = require("express");
const multer = require("multer");

const mediaController = require("../controllers/mediaController");
const authMiddleware = require("../middlewares/authMiddleware");
const mediaHistoryController = require("../controllers/mediaHistoryController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  mediaController.uploadMedia
);


router.get("/history", authMiddleware, mediaHistoryController.getMediaHistory);


module.exports = router;
