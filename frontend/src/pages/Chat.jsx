import { useEffect, useRef, useState } from "react";

import {
  sendMessage,
  getMessages,
} from "../services/messageService";

import { getMe } from "../services/authService";

import { searchUserByEmail } from "../services/userService";

import {
  createPersonalRoom,
  getPersonalMessages,
} from "../services/chatService";

import socket from "../services/socket";
import personalSocket from "../services/personalSocket";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);

  // Personal chat
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [chatUser, setChatUser] = useState(null);
  const [searchError, setSearchError] = useState("");

  const messagesEndRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Load Current User
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await getMe();

        setCurrentUserId(userData.user.id);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error.response?.data?.message ||
            error.message
        );
      }
    };

    loadCurrentUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Group Messages
  |--------------------------------------------------------------------------
  */

  const loadGroupMessages = async () => {
    try {
      const messageData = await getMessages();

      const formattedMessages =
        messageData.data.map((item) => ({
          id: `group-${item.id}`,

          text: item.message,

          time: new Date(
            item.createdAt
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),

          sender:
            Number(item.userId) ===
            Number(currentUserId)
              ? "me"
              : "other",
        }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error(
        "Failed to load group messages:",
        error.response?.data?.message ||
          error.message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Group Chat Initially
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    loadGroupMessages();
  }, [currentUserId]);

  /*
  |--------------------------------------------------------------------------
  | Existing Group WebSocket
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Don't show group messages inside personal chat
        if (roomId) {
          return;
        }

        const newMessage = {
          id: `group-${data.id}-${Date.now()}`,

          text: data.message,

          time: new Date(
            data.createdAt
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),

          sender:
            Number(data.userId) ===
            Number(currentUserId)
              ? "me"
              : "other",
        };

        setMessages((prevMessages) => [
          ...prevMessages,
          newMessage,
        ]);
      } catch (error) {
        console.error(
          "Failed to process group message:",
          error
        );
      }
    };

    socket.addEventListener(
      "message",
      handleSocketMessage
    );

    return () => {
      socket.removeEventListener(
        "message",
        handleSocketMessage
      );
    };
  }, [currentUserId, roomId]);

  /*
  |--------------------------------------------------------------------------
  | Personal Socket.IO Connection
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "Personal Socket.IO connected:",
        personalSocket.id
      );
    };

    const handleDisconnect = () => {
      console.log(
        "Personal Socket.IO disconnected"
      );
    };

    personalSocket.on(
      "connect",
      handleConnect
    );

    personalSocket.on(
      "disconnect",
      handleDisconnect
    );

    return () => {
      personalSocket.off(
        "connect",
        handleConnect
      );

      personalSocket.off(
        "disconnect",
        handleDisconnect
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Receive Personal Messages
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleNewMessage = (data) => {
      // Don't show personal messages in group chat
      if (!roomId) {
        return;
      }

      // Make sure message belongs to current room
      if (
        data.roomId &&
        data.roomId !== roomId
      ) {
        return;
      }

      const newMessage = {
        id: `personal-${data.id}`,

        text: data.message,

        time: new Date(
          data.createdAt || Date.now()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        sender:
          Number(data.userId) ===
          Number(currentUserId)
            ? "me"
            : "other",
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        newMessage,
      ]);
    };

    personalSocket.on(
      "new_message",
      handleNewMessage
    );

    return () => {
      personalSocket.off(
        "new_message",
        handleNewMessage
      );
    };
  }, [currentUserId, roomId]);

  /*
  |--------------------------------------------------------------------------
  | Auto Scroll
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
  |--------------------------------------------------------------------------
  | Start Personal Chat
  |--------------------------------------------------------------------------
  */

  const handleStartChat = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setSearchError(
        "Please enter an email"
      );

      return;
    }

    try {
      setSearchError("");

      /*
       * Search user
       */

      const userData =
        await searchUserByEmail(
          email.trim()
        );

      const targetUser =
        userData.data;

      if (!targetUser) {
        setSearchError(
          "User not found"
        );

        return;
      }

      /*
       * Create/Get personal room
       */

      const roomData =
        await createPersonalRoom(
          targetUser.id
        );

      const newRoomId =
        roomData.roomId;

      /*
       * Get previous messages
       */

      const messageData =
        await getPersonalMessages(
          newRoomId
        );

      const formattedMessages =
        messageData.data.map(
          (item) => ({
            id: `personal-${item.id}`,

            text: item.message,

            time: new Date(
              item.createdAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),

            sender:
              Number(item.userId) ===
              Number(currentUserId)
                ? "me"
                : "other",
          })
        );

      /*
       * Update personal chat
       */

      setChatUser(targetUser);

      setRoomId(newRoomId);

      setMessages(
        formattedMessages
      );

      /*
       * Join Socket.IO room
       */

      personalSocket.emit(
        "join_room",
        newRoomId
      );

      console.log(
        "Joined personal room:",
        newRoomId
      );
    } catch (error) {
      console.error(
        "Failed to start personal chat:",
        error
      );

      setSearchError(
        error.response?.data?.message ||
          error.message ||
          "Failed to start chat"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Switch Back To Group
  |--------------------------------------------------------------------------
  */

  const handleGroupChat = async () => {
    /*
     * Leave personal room
     */

    if (roomId) {
      personalSocket.emit(
        "leave_room",
        roomId
      );
    }

    /*
     * Clear personal state
     */

    setRoomId("");

    setChatUser(null);

    setEmail("");

    setSearchError("");

    /*
     * Load group messages
     */

    if (currentUserId) {
      await loadGroupMessages();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Send Personal Message
  |--------------------------------------------------------------------------
  */

  const handlePersonalMessage = () => {
    if (
      !message.trim() ||
      !roomId ||
      !currentUserId
    ) {
      return;
    }

    personalSocket.emit(
      "send_message",
      {
        roomId,

        message: message.trim(),

        userId: currentUserId,
      }
    );

    setMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | Send Group Message
  |--------------------------------------------------------------------------
  */

  const handleGroupMessage = async () => {
    if (!message.trim()) {
      return;
    }

    try {
      await sendMessage(message);

      setMessage("");
    } catch (error) {
      console.error(
        "Failed to send group message:",
        error.response?.data?.message ||
          error.message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Send Message
  |--------------------------------------------------------------------------
  */

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    if (roomId) {
      handlePersonalMessage();

      return;
    }

    await handleGroupMessage();
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="hidden w-72 border-r bg-white md:block">

        {/* Sidebar Header */}

        <div className="border-b px-5 py-5">

          <h1 className="text-xl font-bold text-gray-800">
            Group Chat
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your conversations
          </p>

        </div>

        {/* Search User */}

        <div className="border-b p-4">

          <form
            onSubmit={handleStartChat}
          >

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter user email..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Chat
            </button>

          </form>

          {searchError && (
            <p className="mt-2 text-xs text-red-500">
              {searchError}
            </p>
          )}

        </div>

        {/* Personal Chat */}

        {chatUser && (
          <div
            className={`border-b px-5 py-4 ${
              roomId
                ? "bg-blue-50"
                : "bg-white"
            }`}
          >

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">

                {chatUser.name
                  ?.charAt(0)
                  .toUpperCase()}

              </div>

              <div className="min-w-0">

                <h2 className="truncate font-semibold text-gray-800">
                  {chatUser.name}
                </h2>

                <p className="truncate text-xs text-gray-500">
                  {chatUser.email}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* General Group */}

        <button
          type="button"
          onClick={handleGroupChat}
          className={`w-full border-b px-5 py-4 text-left transition ${
            !roomId
              ? "bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              GC
            </div>

            <div>

              <h2 className="font-semibold text-gray-800">
                General Group
              </h2>

              <p className="text-xs text-gray-500">
                5 members
              </p>

            </div>

          </div>

        </button>

      </aside>

      {/* Main Chat */}

      <section className="flex min-w-0 flex-1 flex-col">

        {/* Header */}

        <header className="flex items-center border-b bg-white px-5 py-4 shadow-sm">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">

            {chatUser
              ? chatUser.name
                  ?.charAt(0)
                  .toUpperCase()
              : "GC"}

          </div>

          <div className="ml-3 min-w-0">

            <h2 className="truncate font-semibold text-gray-800">

              {chatUser
                ? chatUser.name
                : "General Group"}

            </h2>

            <p className="text-xs text-green-500">
              Online
            </p>

          </div>

        </header>

        {/* Chat Type */}

        {roomId && (
          <div className="border-b bg-blue-50 px-5 py-2">

            <p className="text-xs font-medium text-blue-600">
              Personal Chat
            </p>

          </div>
        )}

        {!roomId && (
          <div className="border-b bg-gray-50 px-5 py-2">

            <p className="text-xs font-medium text-gray-500">
              General Group
            </p>

          </div>
        )}

        {/* Messages */}

        <div className="flex-1 overflow-y-auto bg-gray-100 px-4 py-6 md:px-8">

          <div className="mx-auto flex max-w-4xl flex-col gap-3">

            {messages.length === 0 && (
              <div className="flex flex-1 items-center justify-center py-20">

                <p className="text-sm text-gray-400">

                  {roomId
                    ? "No personal messages yet"
                    : "No group messages yet"}

                </p>

              </div>
            )}

            {messages.map((item) => (

              <div
                key={item.id}
                className={`flex ${
                  item.sender === "me"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    item.sender === "me"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-white text-gray-800"
                  }`}
                >

                  <p className="break-words text-sm leading-6">
                    {item.text}
                  </p>

                  <p
                    className={`mt-1 text-right text-[11px] ${
                      item.sender === "me"
                        ? "text-blue-100"
                        : "text-gray-400"
                    }`}
                  >
                    {item.time}
                  </p>

                </div>

              </div>

            ))}

            <div ref={messagesEndRef} />

          </div>

        </div>

        {/* Input */}

        <div className="border-t bg-white px-4 py-4 md:px-8">

          <form
            onSubmit={handleSend}
            className="mx-auto flex max-w-4xl items-center gap-3"
          >

            <input
              type="text"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder={
                roomId
                  ? "Message..."
                  : "Message group..."
              }
              className="h-12 flex-1 rounded-full border border-gray-300 bg-gray-50 px-5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
            >
              →
            </button>

          </form>

        </div>

      </section>

    </div>
  );
}

export default Chat;