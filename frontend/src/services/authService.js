import api from "./api";

export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);

  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/auth/login", userData);

  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};
