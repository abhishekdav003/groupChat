const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const PersonalMessage = require("./models/PersonalMessage");
const MediaMessage = require("./models/MediaMessage");
const GroupMember = require("./models/GroupMember");
const groupMessageService = require("./services/groupMessageService");
const s3 = require("./config/s3");
const { broadcastMessage } = require("./websocket");

const createPersonalChatServer = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Chat socket connected:", socket.id);

    socket.on("join_room", async (roomId) => {
      try {
        if (typeof roomId !== "string") return;

        const userIds = roomId.split("_").slice(1).map(Number);

        if (
          !roomId.startsWith("private_") ||
          !userIds.includes(Number(socket.userId))
        ) {
          return;
        }

        socket.join(roomId);
      } catch (error) {
        console.error("Join personal room error:", error.message);
      }
    });

    socket.on("leave_room", (roomId) => {
      if (typeof roomId === "string") {
        socket.leave(roomId);
      }
    });

    socket.on("send_message", async (data = {}) => {
      try {
        const { roomId, message } = data;

        if (!roomId || typeof message !== "string" || !message.trim()) {
          return;
        }

        const userIds = roomId.split("_").slice(1).map(Number);

        if (
          !roomId.startsWith("private_") ||
          !userIds.includes(Number(socket.userId))
        ) {
          return;
        }

        const newMessage = await PersonalMessage.create({
          roomId,
          userId: socket.userId,
          message: message.trim(),
        });

        io.to(roomId).emit("new_message", {
          id: newMessage.id,
          roomId: newMessage.roomId,
          userId: newMessage.userId,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
        });
      } catch (error) {
        console.error("Personal message error:", error.message);
      }
    });

    socket.on("join_group", async ({ groupId } = {}) => {
      try {
        const member = await GroupMember.findOne({
          where: { groupId, userId: socket.userId },
        });

        if (!member) {
          socket.emit("group_error", {
            message: "You are not a member of this group",
          });
          return;
        }

        socket.join(`group_${groupId}`);
        socket.emit("group_joined", { groupId });
      } catch (error) {
        console.error("Join group error:", error.message);
      }
    });

    socket.on("send_group_message", async (data = {}) => {
      try {
        const { groupId, message } = data;

        const savedMessage = await groupMessageService.saveGroupMessage(
          groupId,
          socket.userId,
          message,
        );

        io.to(`group_${groupId}`).emit("group_message", {
          id: savedMessage.id,
          groupId: savedMessage.groupId,
          userId: savedMessage.userId,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt,
        });
      } catch (error) {
        socket.emit("group_error", { message: error.message });
      }
    });

    // Broadcast a media message that was already uploaded and saved.
    socket.on("send_media_message", async ({ mediaMessageId } = {}) => {
      try {
        const media = await MediaMessage.findByPk(mediaMessageId);

        if (!media || Number(media.userId) !== Number(socket.userId)) {
          socket.emit("media_error", {
            message: "Media message not found or unauthorized",
          });
          return;
        }

        let roomName;

        if (media.chatType === "personal") {
          const userIds = media.chatId.split("_").slice(1).map(Number);

          if (
            !media.chatId.startsWith("private_") ||
            !userIds.includes(Number(socket.userId))
          ) {
            throw new Error("Invalid personal chat");
          }

          roomName = media.chatId;
        } else if (media.chatType === "group") {
          const member = await GroupMember.findOne({
            where: {
              groupId: Number(media.chatId),
              userId: socket.userId,
            },
          });

          if (!member) {
            throw new Error("You are not a member of this group");
          }

          roomName = `group_${media.chatId}`;
        } else if (media.chatType === "general" && media.chatId === "general") {
          const mediaUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: media.fileKey,
              ResponseContentType: media.fileType,
              ResponseContentDisposition: "inline",
            }),
            { expiresIn: 3600 },
          );

          broadcastMessage({
            type: "media_message",
            id: media.id,
            chatType: media.chatType,
            chatId: media.chatId,
            userId: media.userId,
            fileName: media.fileName,
            fileType: media.fileType,
            fileSize: media.fileSize,
            mediaUrl,
            createdAt: media.createdAt,
          });

          return;
        } else {
          throw new Error("Invalid chat type or chat ID");
        }

        const mediaUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: media.fileKey,
            ResponseContentType: media.fileType,
            ResponseContentDisposition: "inline",
          }),
          { expiresIn: 3600 },
        );

        const payload = {
          id: media.id,
          chatType: media.chatType,
          chatId: media.chatId,
          userId: media.userId,
          fileName: media.fileName,
          fileType: media.fileType,
          fileSize: media.fileSize,
          mediaUrl,
          createdAt: media.createdAt,
        };

        io.to(roomName).emit("media_message", payload);
      } catch (error) {
        console.error("Media broadcast error:", error.message);
        socket.emit("media_error", { message: error.message });
      }
    });

    socket.on("leave_group", ({ groupId } = {}) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on("disconnect", () => {
      console.log("Chat socket disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = createPersonalChatServer;
