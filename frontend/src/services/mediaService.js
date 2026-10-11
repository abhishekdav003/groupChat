import api from "./api";

export const uploadMedia = async (file, chatType, chatId) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("chatType", chatType);
  formData.append("chatId", String(chatId));

  const response = await api.post("/media/upload", formData);

  return response.data;
};


export const getMediaHistory = async (chatType, chatId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/media/history?chatType=${encodeURIComponent(chatType)}&chatId=${encodeURIComponent(chatId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch media history");
  }

  return result;
};
