const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const requestAI = async (endpoint, payload) => {
  const response = await fetch(`${API_URL}/ai/${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "AI request failed");
  }

  return data;
};

export const getPredictiveSuggestions = (
  text,
  recentMessages = [],
  style = "casual",
) => {
  return requestAI("predictive", {
    text,
    recentMessages,
    style,
  });
};

export const getSmartReplies = (
  incomingMessage,
  recentMessages = [],
  style = "casual",
) => {
  return requestAI("smart-replies", {
    incomingMessage,
    recentMessages,
    style,
  });
};
