import api from "./api";

export const createGroup = async (name) => {
  const response = await api.post("/chat/groups", { name });
  return response.data;
};

export const getMyGroups = async () => {
  const response = await api.get("/chat/groups");
  return response.data;
};

export const addGroupMember = async (groupId, email) => {
  const response = await api.post(`/chat/groups/${groupId}/members`, {
    email,
  });
  return response.data;
};

export const getGroupMessages = async (groupId) => {
  const response = await api.get(`/chat/groups/${groupId}/messages`);
  return response.data;
};
