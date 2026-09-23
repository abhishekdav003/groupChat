const WebSocket = require("ws");

let wss;

const createWebSocketServer = (server) => {
  wss = new WebSocket.Server({
    server,
  });

  wss.on("connection", (socket) => {
    console.log("WebSocket client connected");

    socket.on("close", () => {
      console.log("WebSocket client disconnected");
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
