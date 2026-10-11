// The backend WebSocket server listens on the /ws path.
const socket = new WebSocket("ws://localhost:3000/ws");

socket.onopen = () => {
  console.log("Group WebSocket connected");
};

socket.onclose = () => {
  console.log("Group WebSocket disconnected");
};

socket.onerror = (error) => {
  console.error("Group WebSocket error:", error);
};

export default socket;
