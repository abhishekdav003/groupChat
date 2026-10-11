const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");
const MediaMessage = require("../models/MediaMessage");
const GroupMember = require("../models/GroupMember");

const getMediaHistory = async (chatType, chatId, userId) => {
  // Validate chat type
  if (!["general", "personal", "group"].includes(chatType)) {
    throw new Error("Invalid chat type");
  }

  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  // General Group access
  if (chatType === "general" && String(chatId) !== "general") {
    throw new Error("Invalid general chat ID");
  }

  // Personal Chat access
  if (chatType === "personal") {
    const match = /^private_(\d+)_(\d+)$/.exec(String(chatId));

    if (!match || !match.slice(1).map(Number).includes(Number(userId))) {
      throw new Error("Access denied");
    }
  }

  // Custom Group membership
  if (chatType === "group") {
    const groupId = Number(chatId);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      throw new Error("Invalid group ID");
    }

    const member = await GroupMember.findOne({
      where: { groupId, userId },
    });

    if (!member) {
      throw new Error("You are not a member of this group");
    }
  }

  // Fetch media records
  const mediaItems = await MediaMessage.findAll({
    where: {
      chatType,
      chatId: String(chatId),
    },
    order: [["createdAt", "ASC"]],
  });

  // Generate fresh signed URLs
  const history = await Promise.all(
    mediaItems.map(async (item) => {
      const mediaUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: item.fileKey,
          ResponseContentType: item.fileType,
          ResponseContentDisposition: "inline",
        }),
        { expiresIn: 3600 },
      );

      return {
        id: item.id,
        chatType: item.chatType,
        chatId: item.chatId,
        userId: item.userId,
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        mediaUrl,
        createdAt: item.createdAt,
      };
    }),
  );

  return history;
};

module.exports = { getMediaHistory };
