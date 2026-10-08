import api from "./api";

export const searchUserByEmail = async (email) => {
  const response = await api.get(
    `/users/search?email=${encodeURIComponent(email)}`,
  );

  return response.data;
};
