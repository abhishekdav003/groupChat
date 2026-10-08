const WebSocket = require("ws");

let wss;

const createWebSocketServer = (server) => {
  wss = new WebSocket.Server({
    server,
    path: "/ws",
  });

  wss.on("connection", (socket) => {
    console.log("Group WebSocket client connected");

    socket.on("close", () => {
      console.log("Group WebSocket client disconnected");
    });
  });

  return wss;
};

const broadcastMessage = (message) => {
  if (!wss) {
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

module.exports = {
  createWebSocketServer,
  broadcastMessage,
};
