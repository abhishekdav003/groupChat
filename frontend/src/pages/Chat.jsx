
import { useCallback, useEffect, useRef, useState } from "react";

import { getMe } from "../services/authService";
import { getMessages, sendMessage } from "../services/messageService";
import { searchUserByEmail } from "../services/userService";
import {
  createPersonalRoom,
  getPersonalMessages,
} from "../services/chatService";
import {
  addGroupMember,
  createGroup,
  getGroupMessages,
  getMyGroups,
} from "../services/groupService";
import { uploadMedia, getMediaHistory } from "../services/mediaService";

import socket from "../services/socket";
import personalSocket from "../services/personalSocket";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import {
  getPredictiveSuggestions,
  getSmartReplies,
} from "../services/aiService";

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatMessages = (items, currentUserId, type) =>
  items.map((item) => ({
    id: `${type}-${item.id}`,
    text: item.message,
    time: formatTime(item.createdAt),
    createdAt: item.createdAt,
    sender:
      Number(item.userId) === Number(currentUserId) ? "me" : "other",
    senderName: item.sender?.name || "",
  }));

  
const formatMediaMessages = (items, currentUserId, type) =>
  items.map((item) => ({
    id: `media-${item.id}`,
    mediaUrl: item.mediaUrl,
    fileName: item.fileName,
    fileType: item.fileType,
    fileSize: item.fileSize,
    time: formatTime(item.createdAt),
    createdAt: item.createdAt,
    sender:
      Number(item.userId) === Number(currentUserId) ? "me" : "other",
    senderName: item.sender?.name || "",
    chatType: type,
    chatId: item.chatId,
  }));


function Chat() {

  
const loadMediaHistory = useCallback(
  async (type, id, userId) => {
    try {
      const result = await getMediaHistory(type, id);
      return formatMediaMessages(result.data || [], userId, type);
    } catch (error) {
      console.error("Media history error:", error.message);
      return [];
    }
  },
  []
);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [chatUser, setChatUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const chatType = roomId
    ? "personal"
    : activeGroup
    ? "group"
    : "general";

  // AI UI state. Suggestions are optional: AI failures never block chat.
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [smartReplies, setSmartReplies] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [smartRepliesLoading, setSmartRepliesLoading] = useState(false);
  const lastSmartReplyKey = useRef("");
  const activeChatKey = roomId || (activeGroup ? `group-${activeGroup.id}` : "general");

  // Reset AI UI when switching conversations so old suggestions do not leak across chats.
  useEffect(() => {
    setAiSuggestions([]);
    setSmartReplies([]);
    setAiLoading(false);
    setSmartRepliesLoading(false);
    lastSmartReplyKey.current = "";
  }, [activeChatKey]);

  // Predictive typing: wait until the user pauses before requesting Gemini.
  useEffect(() => {
    const draft = message.trim();
    if (draft.length < 3 || selectedFile) {
      setAiSuggestions([]);
      setAiLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setAiLoading(true);
        const recentMessages = messages
          .filter((item) => item.text)
          .slice(-5)
          .map((item) => ({ text: item.text, sender: item.sender }));

        const result = await getPredictiveSuggestions(
          draft,
          recentMessages,
          "casual"
        );

        if (!cancelled) setAiSuggestions(Array.isArray(result?.suggestions) ? result.suggestions.slice(0, 3) : []);
      } catch (error) {
        if (!cancelled) {
          setAiSuggestions([]);
          console.error("AI suggestions error:", error.message);
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [message, messages, selectedFile, activeChatKey]);

  // Smart replies are generated only for the latest incoming text message.
  useEffect(() => {
    let cancelled = false;
    const latestIncoming = [...messages]
      .reverse()
      .find((item) => item.sender === "other" && item.text?.trim());

    if (!latestIncoming) {
      setSmartReplies([]);
      setSmartRepliesLoading(false);
      lastSmartReplyKey.current = "";
      return undefined;
    }

    const requestKey = `${activeChatKey}-${latestIncoming.id}`;
    if (lastSmartReplyKey.current === requestKey) return undefined;

    lastSmartReplyKey.current = requestKey;
    setSmartReplies([]);
    setSmartRepliesLoading(true);

    const recentMessages = messages
      .filter((item) => item.text)
      .slice(-5)
      .map((item) => ({ text: item.text, sender: item.sender }));

    const loadReplies = async () => {
      try {
        const result = await getSmartReplies(
          latestIncoming.text,
          recentMessages,
          "casual"
        );
        if (!cancelled) setSmartReplies(Array.isArray(result?.replies) ? result.replies.slice(0, 3) : []);
      } catch (error) {
        if (!cancelled) {
          setSmartReplies([]);
          console.error("Smart replies error:", error.message);
        }
      } finally {
        if (!cancelled) setSmartRepliesLoading(false);
      }
    };

    loadReplies();
    return () => {
      cancelled = true;
    };
  }, [messages, activeChatKey]);

  const loadGeneralMessages = useCallback(async (userId) => {
    try {
      const [result, mediaHistory] = await Promise.all([
        getMessages(),
        loadMediaHistory("general", "general", userId),
      ]);

      const textMessages = formatMessages(result.data || [], userId, "general");
      setMessages(
        [...textMessages, ...mediaHistory].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        )
      );
    } catch (error) {
      console.error(
        "Failed to load general messages:",
        error.response?.data?.message || error.message
      );
    }
  }, [loadMediaHistory]);

  const loadGroups = useCallback(async () => {
    try {
      const result = await getMyGroups();
      setGroups(result.data || []);
    } catch (error) {
      console.error(
        "Failed to load groups:",
        error.response?.data?.message || error.message
      );
    }
  }, []);

  // Load current user and establish Socket.IO connection.
  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await getMe();
        setCurrentUserId(result.user.id);

        if (localStorage.getItem("token") && !personalSocket.connected) {
          personalSocket.connect();
        }
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error.response?.data?.message || error.message
        );
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const savedChats = localStorage.getItem(
      `recentChats-${currentUserId}`
    );

    if (savedChats) {
      try {
        setRecentChats(JSON.parse(savedChats));
      } catch {
        localStorage.removeItem(`recentChats-${currentUserId}`);
      }
    }

    loadGeneralMessages(currentUserId);
    loadGroups();
  }, [currentUserId, loadGeneralMessages, loadGroups]);

  // General Group: existing WebSocket.
  useEffect(() => {
    const handleGeneralMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (roomId || activeGroup) return;

        // General Group media broadcast.
        if (data.type === "media_message") {
          setMessages((previous) => {
            if (previous.some((item) => item.id === `media-${data.id}`)) {
              return previous;
            }

            return [
              ...previous,
              {
                id: `media-${data.id}`,
                mediaUrl: data.mediaUrl,
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                time: formatTime(data.createdAt || Date.now()),
                createdAt: data.createdAt || new Date().toISOString(),
                sender:
                  Number(data.userId) === Number(currentUserId)
                    ? "me"
                    : "other",
              },
            ];
          });

          return;
        }

        // Existing text messages.
        if (!data.message) return;

        setMessages((previous) => {
          if (previous.some((item) => item.id === `general-${data.id}`)) {
            return previous;
          }

          return [
            ...previous,
            {
              id: `general-${data.id}`,
              text: data.message,
              time: formatTime(data.createdAt || Date.now()),
              createdAt: data.createdAt || new Date().toISOString(),
              sender:
                Number(data.userId) === Number(currentUserId)
                  ? "me"
                  : "other",
            },
          ];
        });
      } catch (error) {
        console.error("Failed to receive general message:", error);
      }
    };

    socket.addEventListener("message", handleGeneralMessage);

    return () => {
      socket.removeEventListener("message", handleGeneralMessage);
    };
  }, [currentUserId, roomId, activeGroup]);

  // Personal chat: text messages.
  useEffect(() => {
    const handlePersonalMessage = (data) => {
      if (!roomId || data.roomId !== roomId) return;

      setMessages((previous) => {
        if (previous.some((item) => item.id === `personal-${data.id}`)) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `personal-${data.id}`,
            text: data.message,
            time: formatTime(data.createdAt || Date.now()),
            sender:
              Number(data.userId) === Number(currentUserId)
                ? "me"
                : "other",
          },
        ];
      });
    };

    personalSocket.on("new_message", handlePersonalMessage);

    return () => {
      personalSocket.off("new_message", handlePersonalMessage);
    };
  }, [currentUserId, roomId]);

  // Custom Group: text messages and errors.
  useEffect(() => {
    const handleGroupMessage = (data) => {
      if (!activeGroup || Number(data.groupId) !== Number(activeGroup.id)) {
        return;
      }

      setMessages((previous) => {
        if (previous.some((item) => item.id === `custom-${data.id}`)) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `custom-${data.id}`,
            text: data.message,
            time: formatTime(data.createdAt || Date.now()),
            sender:
              Number(data.userId) === Number(currentUserId)
                ? "me"
                : "other",
          },
        ];
      });
    };

    const handleGroupError = (data) => {
      setSearchError(data.message || "Group chat error");
    };

    personalSocket.on("group_message", handleGroupMessage);
    personalSocket.on("group_error", handleGroupError);

    return () => {
      personalSocket.off("group_message", handleGroupMessage);
      personalSocket.off("group_error", handleGroupError);
    };
  }, [currentUserId, activeGroup]);

  // Receive media in personal chats and custom groups.
  useEffect(() => {
    const handleMediaMessage = (data) => {
      const belongsToCurrentChat =
        (chatType === "personal" &&
          data.chatType === "personal" &&
          data.chatId === roomId) ||
        (chatType === "group" &&
          data.chatType === "group" &&
          Number(data.chatId) === Number(activeGroup?.id));

      if (!belongsToCurrentChat) return;

      setMessages((previous) => {
        if (previous.some((item) => item.id === `media-${data.id}`)) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `media-${data.id}`,
            mediaUrl: data.mediaUrl,
            fileName: data.fileName,
            fileType: data.fileType,
            fileSize: data.fileSize,
            time: formatTime(data.createdAt || Date.now()),
            sender:
              Number(data.userId) === Number(currentUserId)
                ? "me"
                : "other",
          },
        ];
      });
    };

    const handleMediaError = (data) => {
      setSearchError(data.message || "Media message failed");
    };

    personalSocket.on("media_message", handleMediaMessage);
    personalSocket.on("media_error", handleMediaError);

    return () => {
      personalSocket.off("media_message", handleMediaMessage);
      personalSocket.off("media_error", handleMediaError);
    };
  }, [chatType, roomId, activeGroup, currentUserId]);

  const leaveCurrentChat = () => {
    if (roomId) {
      personalSocket.emit("leave_room", roomId);
    }

    if (activeGroup) {
      personalSocket.emit("leave_group", {
        groupId: activeGroup.id,
      });
    }
  };

  const openPersonalChat = async (user) => {
    try {
      setSearchError("");

      if (Number(user.id) === Number(currentUserId)) {
        setSearchError("You cannot chat with yourself.");
        return;
      }

      leaveCurrentChat();

      const room = await createPersonalRoom(user.id);
      const [result, mediaHistory] = await Promise.all([
        getPersonalMessages(room.roomId),
        loadMediaHistory("personal", room.roomId, currentUserId),
      ]);

      setChatUser(user);
      setActiveGroup(null);
      setRoomId(room.roomId);
      setSelectedFile(null);
      setMessages(
        [...formatMessages(result.data || [], currentUserId, "personal"), ...mediaHistory].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        )
      );

      if (!personalSocket.connected) {
        personalSocket.connect();
      }

      personalSocket.emit("join_room", room.roomId);

      setRecentChats((previous) => {
        const updated = [
          user,
          ...previous.filter((item) => Number(item.id) !== Number(user.id)),
        ];

        localStorage.setItem(
          `recentChats-${currentUserId}`,
          JSON.stringify(updated)
        );

        return updated;
      });
    } catch (error) {
      console.error("Failed to open personal chat:", error);

      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Could not open chat."
      );
    }
  };

  const handleStartChat = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setSearchError("Please enter an email.");
      return;
    }

    try {
      setSearchError("");

      const result = await searchUserByEmail(email.trim());
      await openPersonalChat(result.data);
      setEmail("");
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "User not found."
      );
    }
  };

  const handleGeneralGroup = async () => {
    leaveCurrentChat();

    setRoomId("");
    setChatUser(null);
    setActiveGroup(null);
    setSelectedFile(null);
    setSearchError("");

    if (currentUserId) {
      await loadGeneralMessages(currentUserId);
    }
  };

  const handleCreateGroup = async () => {
    const name = window.prompt("Enter a name for your group:");

    if (!name?.trim()) return;

    try {
      setSearchError("");

      const result = await createGroup(name.trim());

      await loadGroups();
      await openGroup(result.data);
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Could not create group."
      );
    }
  };

  const openGroup = async (group) => {
    try {
      setSearchError("");
      leaveCurrentChat();

      const [result, mediaHistory] = await Promise.all([
        getGroupMessages(group.id),
        loadMediaHistory("group", String(group.id), currentUserId),
      ]);

      setRoomId("");
      setChatUser(null);
      setActiveGroup(group);
      setSelectedFile(null);
      setMessages(
        [...formatMessages(result.data || [], currentUserId, "custom"), ...mediaHistory].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        )
      );

      if (!personalSocket.connected) {
        personalSocket.connect();
      }

      personalSocket.emit("join_group", {
        groupId: group.id,
      });
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Could not open group."
      );
    }
  };

  const handleAddGroupMember = async (group) => {
    const memberEmail = window.prompt(
      `Enter the email address to add to ${group.name}:`
    );

    if (!memberEmail?.trim()) return;

    try {
      await addGroupMember(group.id, memberEmail.trim());
      window.alert("Member added successfully.");
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Could not add member."
      );
    }
  };

  // Upload a selected file, then request a room broadcast.
  const handleMediaUpload = async () => {
    if (!selectedFile || uploading) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setSearchError("File size must be 50 MB or less.");
      return;
    }

    if (!currentUserId) {
      setSearchError("Please sign in before sharing media.");
      return;
    }

    try {
      setUploading(true);
      setSearchError("");

      if (chatType !== "general" && !personalSocket.connected) {
        throw new Error("Chat connection is unavailable. Please try again.");
      }

      const chatId =
        chatType === "personal"
          ? roomId
          : chatType === "group"
          ? String(activeGroup.id)
          : "general";

      const result = await uploadMedia(selectedFile, chatType, chatId);
      const media = result.data;

      if (!media?.id) {
        throw new Error("Upload succeeded, but the media record ID is missing.");
      }

      
if (!personalSocket.connected) {
  throw new Error("Chat connection is not ready. Please try again.");
}

personalSocket.emit("send_media_message", {
  mediaMessageId: media.id,
});


      setSelectedFile(null);
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Media upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (selectedFile) {
      await handleMediaUpload();
      return;
    }

    const text = message.trim();

    if (!text) return;

    if (chatType === "personal") {
      if (!personalSocket.connected) {
        setSearchError("Chat connection is unavailable. Please try again.");
        return;
      }

      personalSocket.emit("send_message", {
        roomId,
        message: text,
      });

      setMessage("");
      return;
    }

    if (chatType === "group") {
      if (!personalSocket.connected) {
        setSearchError("Chat connection is unavailable. Please try again.");
        return;
      }

      personalSocket.emit("send_group_message", {
        groupId: activeGroup.id,
        message: text,
      });

      setMessage("");
      return;
    }

    try {
      await sendMessage(text);
      setMessage("");
    } catch (error) {
      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Message not sent."
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        email={email}
        setEmail={setEmail}
        onStartChat={handleStartChat}
        searchError={searchError}
        recentChats={recentChats}
        activeUserId={chatUser?.id}
        onOpenChat={openPersonalChat}
        onGroupChat={handleGeneralGroup}
        isGeneralGroup={chatType === "general"}
        groups={groups}
        activeGroupId={activeGroup?.id}
        onCreateGroup={handleCreateGroup}
        onOpenGroup={openGroup}
        onAddGroupMember={handleAddGroupMember}
      />

      <ChatWindow
        chatUser={chatUser}
        activeGroup={activeGroup}
        chatType={chatType}
        messages={messages}
        message={message}
        setMessage={setMessage}
        onSend={handleSend}
        onSelectFile={setSelectedFile}
        selectedFile={selectedFile}
        uploading={uploading}
        aiSuggestions={aiSuggestions}
        smartReplies={smartReplies}
        aiLoading={aiLoading}
        smartRepliesLoading={smartRepliesLoading}
        onSelectSuggestion={(suggestion) => {
          setMessage((current) => {
            const trimmed = current.trimEnd();
            const separator = trimmed && !/\s$/.test(current) ? " " : "";
            return `${trimmed}${separator}${suggestion}`;
          });
          setAiSuggestions([]);
        }}
        onSelectSmartReply={(reply) => {
          setMessage(reply);
          setAiSuggestions([]);
        }}
      />
    </div>
  );
}

export default Chat;
