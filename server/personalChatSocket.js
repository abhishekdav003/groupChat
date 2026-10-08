const { Server } = require("socket.io");

const PersonalMessage = require("./models/PersonalMessage");

const createPersonalChatServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Personal chat user connected:", socket.id);

    /*
     * Join personal room
     */
    socket.on("join_room", (roomId) => {
      socket.join(roomId);

      console.log(`${socket.id} joined room: ${roomId}`);
    });

    /*
     * Leave personal room
     */
    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);

      console.log(`${socket.id} left room: ${roomId}`);
    });

    /*
     * Send personal message
     */
    socket.on("send_message", async (data) => {
      try {
        const { roomId, message, userId } = data;

        if (!roomId || !message || !userId) {
          return;
        }

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
          return;
        }

        /*
         * Save message in database
         */
        const newMessage = await PersonalMessage.create({
          roomId,
          userId,
          message: trimmedMessage,
        });

        /*
         * Send saved message to everyone
         * inside the personal room
         */
        io.to(roomId).emit("new_message", {
          id: newMessage.id,
          roomId: newMessage.roomId,
          userId: newMessage.userId,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
        });

        console.log(`Personal message saved in room ${roomId}`);
      } catch (error) {
        console.error("Personal message error:", error);
      }
    });

    /*
     * Disconnect
     */
    socket.on("disconnect", () => {
      console.log("Personal chat user disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = createPersonalChatServer;
