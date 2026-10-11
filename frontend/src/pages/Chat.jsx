import { useCallback, useEffect, useState } from "react";

import { getMe } from "../services/authService";
import { getMessages, sendMessage } from "../services/messageService";
import { searchUserByEmail } from "../services/userService";
import { createPersonalRoom, getPersonalMessages } from "../services/chatService";
import { addGroupMember, createGroup, getGroupMessages, getMyGroups } from "../services/groupService";
import socket from "../services/socket";
import personalSocket from "../services/personalSocket";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatMessages = (items, currentUserId, type) =>
  items.map((item) => ({
    id: `${type}-${item.id}`,
    text: item.message,
    time: formatTime(item.createdAt),
    sender: Number(item.userId) === Number(currentUserId) ? "me" : "other",
    senderName: item.sender?.name || "",
  }));

function Chat() {
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

  const chatType = roomId ? "personal" : activeGroup ? "group" : "general";

  const loadGeneralMessages = useCallback(async (userId) => {
    try {
      const result = await getMessages();
      setMessages(formatMessages(result.data, userId, "general"));
    } catch (error) {
      console.error("Failed to load general messages:", error.response?.data?.message || error.message);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const result = await getMyGroups();
      setGroups(result.data || []);
    } catch (error) {
      console.error("Failed to load groups:", error.response?.data?.message || error.message);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await getMe();
        setCurrentUserId(result.user.id);
        if (localStorage.getItem("token") && !personalSocket.connected) {
          personalSocket.connect();
        }
      } catch (error) {
        console.error("Failed to load current user:", error.response?.data?.message || error.message);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const savedChats = localStorage.getItem(`recentChats-${currentUserId}`);
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

  // Existing General Group WebSocket.
  useEffect(() => {
    const handleGeneralMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (roomId || activeGroup) return;

        setMessages((previous) => {
          if (previous.some((item) => item.id === `general-${data.id}`)) return previous;
          return [...previous, {
            id: `general-${data.id}`,
            text: data.message,
            time: formatTime(data.createdAt || Date.now()),
            sender: Number(data.userId) === Number(currentUserId) ? "me" : "other",
          }];
        });
      } catch (error) {
        console.error("Failed to receive general message:", error);
      }
    };

    socket.addEventListener("message", handleGeneralMessage);
    return () => socket.removeEventListener("message", handleGeneralMessage);
  }, [currentUserId, roomId, activeGroup]);

  // Existing Personal Chat messages.
  useEffect(() => {
    const handlePersonalMessage = (data) => {
      if (!roomId || data.roomId !== roomId) return;
      setMessages((previous) => {
        if (previous.some((item) => item.id === `personal-${data.id}`)) return previous;
        return [...previous, {
          id: `personal-${data.id}`,
          text: data.message,
          time: formatTime(data.createdAt || Date.now()),
          sender: Number(data.userId) === Number(currentUserId) ? "me" : "other",
        }];
      });
    };
    personalSocket.on("new_message", handlePersonalMessage);
    return () => personalSocket.off("new_message", handlePersonalMessage);
  }, [currentUserId, roomId]);

  // Custom Group messages.
  useEffect(() => {
    const handleGroupMessage = (data) => {
      if (!activeGroup || Number(data.groupId) !== Number(activeGroup.id)) return;
      setMessages((previous) => {
        if (previous.some((item) => item.id === `custom-${data.id}`)) return previous;
        return [...previous, {
          id: `custom-${data.id}`,
          text: data.message,
          time: formatTime(data.createdAt || Date.now()),
          sender: Number(data.userId) === Number(currentUserId) ? "me" : "other",
        }];
      });
    };

    const handleGroupError = (data) => setSearchError(data.message || "Group chat error");
    personalSocket.on("group_message", handleGroupMessage);
    personalSocket.on("group_error", handleGroupError);
    return () => {
      personalSocket.off("group_message", handleGroupMessage);
      personalSocket.off("group_error", handleGroupError);
    };
  }, [currentUserId, activeGroup]);

  const leaveCurrentChat = () => {
    if (roomId) personalSocket.emit("leave_room", roomId);
    if (activeGroup) personalSocket.emit("leave_group", { groupId: activeGroup.id });
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
      const result = await getPersonalMessages(room.roomId);

      setChatUser(user);
      setActiveGroup(null);
      setRoomId(room.roomId);
      setMessages(formatMessages(result.data, currentUserId, "personal"));

      if (!personalSocket.connected) personalSocket.connect();
      personalSocket.emit("join_room", room.roomId);

      setRecentChats((previous) => {
        const updated = [user, ...previous.filter((item) => Number(item.id) !== Number(user.id))];
        localStorage.setItem(`recentChats-${currentUserId}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Failed to open personal chat:", error);
      setSearchError(error.response?.data?.message || error.message || "Could not open chat.");
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
      setSearchError(error.response?.data?.message || error.message || "User not found.");
    }
  };

  const handleGeneralGroup = async () => {
    leaveCurrentChat();
    setRoomId("");
    setChatUser(null);
    setActiveGroup(null);
    setSearchError("");
    if (currentUserId) await loadGeneralMessages(currentUserId);
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
      setSearchError(error.response?.data?.message || error.message || "Could not create group.");
    }
  };

  const openGroup = async (group) => {
    try {
      setSearchError("");
      leaveCurrentChat();
      const result = await getGroupMessages(group.id);
      setRoomId("");
      setChatUser(null);
      setActiveGroup(group);
      setMessages(formatMessages(result.data, currentUserId, "custom"));
      if (!personalSocket.connected) personalSocket.connect();
      personalSocket.emit("join_group", { groupId: group.id });
    } catch (error) {
      setSearchError(error.response?.data?.message || error.message || "Could not open group.");
    }
  };

  const handleAddGroupMember = async (group) => {
    const memberEmail = window.prompt(`Enter the email address to add to ${group.name}:`);
    if (!memberEmail?.trim()) return;

    try {
      await addGroupMember(group.id, memberEmail.trim());
      window.alert("Member added successfully.");
    } catch (error) {
      setSearchError(error.response?.data?.message || error.message || "Could not add member.");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;

    if (chatType === "personal") {
      if (!personalSocket.connected) {
        setSearchError("Chat connection is unavailable. Please try again.");
        return;
      }
      personalSocket.emit("send_message", { roomId, message: text });
      setMessage("");
      return;
    }

    if (chatType === "group") {
      if (!personalSocket.connected) {
        setSearchError("Chat connection is unavailable. Please try again.");
        return;
      }
      personalSocket.emit("send_group_message", { groupId: activeGroup.id, message: text });
      setMessage("");
      return;
    }

    try {
      await sendMessage(text);
      setMessage("");
    } catch (error) {
      setSearchError(error.response?.data?.message || error.message || "Message not sent.");
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
      />
    </div>
  );
}

export default Chat;
