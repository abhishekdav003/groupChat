import api from "./api";

export const sendMessage = async (message) => {
  const response = await api.post("/messages", {
    message,
  });

  return response.data;
};

export const getMessages = async () => {
  const response = await api.get("/messages");

  return response.data;
};
