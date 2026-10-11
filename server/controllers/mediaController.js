const mediaService = require("../services/mediaService");
const MediaMessage = require("../models/MediaMessage");
const GroupMember = require("../models/GroupMember");

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

const uploadMedia = async (req, res) => {
  try {
    const { chatType, chatId } = req.body;

    // Validate file
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file",
      });
    }

    // Validate chat details
    if (!["general", "personal", "group"].includes(chatType) || !chatId) {
      return res.status(400).json({
        message: "Valid chatType and chatId are required",
      });
    }

    // Validate file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Only images, videos, and PDF files are allowed",
      });
    }

    // Validate General Group
    if (chatType === "general" && String(chatId) !== "general") {
      return res.status(400).json({
        message: "Invalid general chat ID",
      });
    }

    // Validate Personal Chat
    if (chatType === "personal") {
      const match = /^private_(\d+)_(\d+)$/.exec(String(chatId));

      if (!match || !match.slice(1).map(Number).includes(Number(req.user.id))) {
        return res.status(403).json({
          message: "Invalid personal chat or access denied",
        });
      }
    }

    // Validate Custom Group Membership
    if (chatType === "group") {
      const groupId = Number(chatId);

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          message: "Invalid group ID",
        });
      }

      const member = await GroupMember.findOne({
        where: {
          groupId,
          userId: req.user.id,
        },
      });

      if (!member) {
        return res.status(403).json({
          message: "You are not a member of this group",
        });
      }
    }

    // Upload file to AWS S3
    const media = await mediaService.uploadMedia(req.file);

    // Save media metadata in MySQL
    const savedMedia = await MediaMessage.create({
      chatType,
      chatId: String(chatId),
      userId: req.user.id,
      fileKey: media.fileKey,
      fileName: media.fileName,
      fileType: media.fileType,
      fileSize: media.fileSize,
    });

    return res.status(201).json({
      message: "Media uploaded successfully",
      data: {
        id: savedMedia.id,
        chatType: savedMedia.chatType,
        chatId: savedMedia.chatId,
        userId: savedMedia.userId,
        fileName: savedMedia.fileName,
        fileType: savedMedia.fileType,
        fileSize: savedMedia.fileSize,
        createdAt: savedMedia.createdAt,
        mediaUrl: media.mediaUrl,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error.message);

    return res.status(500).json({
      message: "Failed to upload or save media",
    });
  }
};

module.exports = { uploadMedia };
