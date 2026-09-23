import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">

          <h1 className="text-xl font-bold text-gray-800">
            Group Chat
          </h1>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Logout
          </button>

        </div>
      </header>

      {/* Dashboard */}
      <main className="mx-auto max-w-6xl px-6 py-12">

        <div className="rounded-xl bg-white p-10 text-center shadow-sm">

          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h2>

          <p className="mt-3 text-gray-500">
            Welcome to the Group Chat application.
          </p>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;