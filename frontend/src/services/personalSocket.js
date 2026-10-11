import { io } from "socket.io-client";

const personalSocket = io("http://localhost:3000", {
  autoConnect: false,
  auth: (callback) => {
    callback({
      token: localStorage.getItem("token"),
    });
  },
});

export default personalSocket;
