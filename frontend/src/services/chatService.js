import api from "./api";

export const createPersonalRoom = async (userId) => {
  const response = await api.post("/chat/room", {
    userId,
  });

  return response.data;
};

export const getPersonalMessages = async (roomId) => {
  const response = await api.get(`/chat/messages/${roomId}`);

  return response.data;
};
