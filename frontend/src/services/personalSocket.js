import { io } from "socket.io-client";

const personalSocket = io("http://localhost:3000");

export default personalSocket;
