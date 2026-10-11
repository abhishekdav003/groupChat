
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const PersonalMessage = require("./models/PersonalMessage");
const GroupMember = require("./models/GroupMember");
const groupMessageService = require("./services/groupMessageService");

const createPersonalChatServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Authenticate socket connections
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

    // Existing personal chat events
    socket.on("join_room", (roomId) => {
      if (typeof roomId === "string" && roomId.startsWith("private_")) {
        socket.join(roomId);
      }
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("send_message", async (data) => {
      try {
        const { roomId, message } = data || {};

        if (
          !roomId ||
          typeof message !== "string" ||
          !message.trim()
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

    // Join a custom group
    socket.on("join_group", async ({ groupId } = {}) => {
      try {
        const member = await GroupMember.findOne({
          where: {
            groupId,
            userId: socket.userId,
          },
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

    // Send a custom group message
    socket.on("send_group_message", async (data = {}) => {
      try {
        const { groupId, message } = data;

        const savedMessage =
          await groupMessageService.saveGroupMessage(
            groupId,
            socket.userId,
            message
          );

        io.to(`group_${groupId}`).emit("group_message", {
          id: savedMessage.id,
          groupId: savedMessage.groupId,
          userId: savedMessage.userId,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt,
        });
      } catch (error) {
        socket.emit("group_error", {
          message: error.message,
        });
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
