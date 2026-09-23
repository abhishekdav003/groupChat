import api from "./api";

export const sendMessage = async (message) => {
  const response = await api.post("/messages", {
    message,
  });

  return response.data;
};
