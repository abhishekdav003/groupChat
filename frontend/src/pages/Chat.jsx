import { useEffect, useRef, useState } from "react";

const initialMessages = [
  {
    id: 1,
    text: "Hey! How are you?",
    time: "10:30 AM",
    sender: "other",
  },
  {
    id: 2,
    text: "I'm good. Working on the group chat application.",
    time: "10:31 AM",
    sender: "me",
  },
  {
    id: 3,
    text: "Nice! How is it going?",
    time: "10:32 AM",
    sender: "other",
  },
  {
    id: 4,
    text: "Pretty good. I'm working on the chat UI right now.",
    time: "10:33 AM",
    sender: "me",
  },
  {
    id: 5,
    text: "Looks interesting 👍",
    time: "10:34 AM",
    sender: "other",
  },
];

function Chat() {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: message.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      newMessage,
    ]);

    setMessage("");
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="hidden w-72 border-r bg-white md:block">

        <div className="border-b px-5 py-5">
          <h1 className="text-xl font-bold text-gray-800">
            Group Chat
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your conversations
          </p>
        </div>

        <div className="border-b bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
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
        </div>

      </aside>

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col">

        {/* Chat Header */}
        <header className="flex items-center border-b bg-white px-5 py-4 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            GC
          </div>

          <div className="ml-3">
            <h2 className="font-semibold text-gray-800">
              General Group
            </h2>

            <p className="text-xs text-green-500">
              Online
            </p>
          </div>

        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-100 px-4 py-6 md:px-8">

          <div className="mx-auto flex max-w-4xl flex-col gap-3">

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

        {/* Message Input */}
        <div className="border-t bg-white px-4 py-4 md:px-8">

          <form
            onSubmit={handleSend}
            className="mx-auto flex max-w-4xl items-center gap-3"
          >

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
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