import { useEffect, useRef } from "react";

function ChatWindow({
  chatUser,
  activeGroup,
  chatType,
  messages,
  message,
  setMessage,
  onSend,
  onSelectFile,
  selectedFile,
  uploading,
  aiSuggestions = [],
  smartReplies = [],
  aiLoading = false,
  smartRepliesLoading = false,
  onSelectSuggestion = () => {},
  onSelectSmartReply = () => {},
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const title =
    chatType === "general"
      ? "General Group"
      : chatType === "group"
      ? activeGroup?.name
      : chatUser?.name;

  const subtitle =
    chatType === "general"
      ? "Everyone's conversation"
      : chatType === "group"
      ? "Custom group"
      : chatUser?.email;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center border-b bg-white px-5 py-4 shadow-sm">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
            chatType === "group" ? "bg-purple-600" : "bg-blue-600"
          }`}
        >
          {title?.charAt(0)?.toUpperCase() || "G"}
        </div>
        <div className="ml-3 min-w-0">
          <h2 className="truncate font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </header>

      <div className="border-b bg-gray-50 px-5 py-2">
        <p className="text-xs font-medium text-gray-500">
          {chatType === "general"
            ? "General Group"
            : chatType === "group"
            ? "Group Chat"
            : "Personal Chat"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-sm text-gray-400">
                {chatType === "personal"
                  ? "No personal messages yet"
                  : "No messages yet. Start the conversation!"}
              </p>
            </div>
          )}

          {messages.map((item) => (
            <div
              key={item.id}
              className={`flex ${item.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  item.sender === "me"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-white text-gray-800"
                }`}
              >
                {item.senderName && item.sender !== "me" && (
                  <p className="mb-1 text-xs font-semibold text-purple-600">
                    {item.senderName}
                  </p>
                )}

                {item.text && (
                  <p className="break-words text-sm leading-6">{item.text}</p>
                )}

                {item.mediaUrl && (
                  <div className="mt-2">
                    {item.fileType?.startsWith("image/") ? (
                      <a href={item.mediaUrl} target="_blank" rel="noreferrer">
                        <img
                          src={item.mediaUrl}
                          alt={item.fileName || "Shared image"}
                          className="max-h-72 max-w-full rounded-lg object-contain"
                        />
                      </a>
                    ) : item.fileType?.startsWith("video/") ? (
                      <video
                        src={item.mediaUrl}
                        controls
                        className="max-h-72 max-w-full rounded-lg"
                      />
                    ) : (
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm underline"
                      >
                        {item.fileName || "Open shared file"}
                      </a>
                    )}
                  </div>
                )}

                <p
                  className={`mt-1 text-right text-[11px] ${
                    item.sender === "me" ? "text-blue-100" : "text-gray-400"
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

      <div className="border-t bg-white px-4 py-4 md:px-8">
        {!selectedFile && message.trim() && (aiLoading || aiSuggestions.length > 0) && (
          <div className="mx-auto mb-3 max-w-4xl rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-indigo-800">✨ AI writing suggestions</p>
              {aiLoading && <span className="text-xs text-indigo-600">Thinking…</span>}
            </div>
            {aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-left text-xs text-indigo-900 transition hover:bg-indigo-100"
                    title="Add this continuation to your draft"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedFile && (smartRepliesLoading || smartReplies.length > 0) && (
          <div className="mx-auto mb-3 max-w-4xl rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-800">💬 Suggested replies</p>
              {smartRepliesLoading && <span className="text-xs text-emerald-700">Thinking…</span>}
            </div>
            {smartReplies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {smartReplies.map((reply, index) => (
                  <button
                    key={`${reply}-${index}`}
                    type="button"
                    onClick={() => onSelectSmartReply(reply)}
                    className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-900 transition hover:bg-emerald-100"
                    title="Use this reply in the message box"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedFile && (
          <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between rounded-lg bg-gray-100 p-3">
            <p className="truncate text-sm text-gray-700">Selected: {selectedFile.name}</p>
            <button
              type="button"
              onClick={() => {
                onSelectFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-3 text-sm text-red-600"
            >
              Remove
            </button>
          </div>
        )}

        <form onSubmit={onSend} className="mx-auto flex max-w-4xl items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
          />
          <button
            type="button"
            aria-label="Attach media"
            title="Attach image, video or PDF"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            📎
          </button>
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={chatType === "personal" ? "Message..." : "Message group..."}
            className="h-12 min-w-0 flex-1 rounded-full border border-gray-300 bg-gray-50 px-5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={uploading || (!selectedFile && !message.trim())}
            aria-label="Send message"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "…" : "→"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChatWindow;
