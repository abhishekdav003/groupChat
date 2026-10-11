function ChatSidebar({
  email,
  setEmail,
  onStartChat,
  searchError,
  recentChats,
  activeUserId,
  onOpenChat,
  onGroupChat,
  isGeneralGroup,
  groups,
  activeGroupId,
  onCreateGroup,
  onOpenGroup,
  onAddGroupMember,
}) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r bg-white">
      <div className="border-b px-5 py-5">
        <h1 className="text-xl font-bold text-gray-800">Group Chat</h1>
        <p className="mt-1 text-sm text-gray-500">Your conversations</p>
      </div>

      <div className="border-b p-4">
        <form onSubmit={onStartChat}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter user email..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find Contact
          </button>
        </form>
        {searchError && (
          <p className="mt-2 break-words text-xs text-red-500">{searchError}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onGroupChat}
          className={`w-full border-b px-5 py-4 text-left transition ${
            isGeneralGroup ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              GC
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">General Group</h2>
              <p className="text-xs text-gray-500">Everyone's conversation</p>
            </div>
          </div>
        </button>

        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Your groups
          </h3>
          <button
            type="button"
            onClick={onCreateGroup}
            className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            + Create
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="px-5 pb-3 text-sm text-gray-400">Your created and joined groups will appear here.</p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center gap-1 border-b px-3 py-2 ${
                Number(activeGroupId) === Number(group.id) ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <button
                type="button"
                onClick={() => onOpenGroup(group)}
                className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 font-semibold text-white">
                  {group.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-800">{group.name}</h2>
                  <p className="text-xs text-gray-500">Group chat</p>
                </div>
              </button>
              <button
                type="button"
                title="Add member"
                onClick={() => onAddGroupMember(group)}
                className="rounded-lg px-2 py-2 text-sm font-bold text-gray-500 hover:bg-white hover:text-blue-600"
              >
                +
              </button>
            </div>
          ))
        )}

        <div className="px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recent chats</h3>
        </div>
        {recentChats.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-gray-400">Contacts you chat with will appear here.</p>
        ) : (
          recentChats.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onOpenChat(user)}
              className={`w-full border-b px-5 py-4 text-left transition ${
                Number(activeUserId) === Number(user.id) ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-800">{user.name}</h2>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default ChatSidebar;
