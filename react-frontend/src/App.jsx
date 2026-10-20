//src/App.jsx

import { useContext, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { UserContext } from "./context/UserContextValue.js";

const BACKEND_URL = import.meta.env.VITE_API_URL;

function Home() {
  const { user, loading, login, logout } = useContext(UserContext);
  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await login({ role, identifier, password });
      setPassword("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setMessage("");
    setBusy(true);
    try {
      await logout();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
      <h1>School App</h1>
      {loading ? (
        <p>Checking sign-in…</p>
      ) : user ? (
        <section>
          <p>
            Signed in as {user.username} ({user.role}) — {user.email}
          </p>
          <button type="button" onClick={handleLogout} disabled={busy}>
            {busy ? "Please wait…" : "Log out"}
          </button>
        </section>
      ) : (
        <form onSubmit={handleLogin}>
          <label>
            Role{" "}
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>
          <label>
            Username or email{" "}
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password{" "}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
      )}
      {message && <p role="alert">{message}</p>}
      {BACKEND_URL && (
        <iframe
          title="Backend home page"
          src={`${BACKEND_URL}/`}
          style={{
            display: "block",
            width: "100%",
            height: "70vh",
            border: 0,
            marginTop: "1.5rem",
          }}
        />
      )}
    </main>
  );
}

export default function App() {
  if (!BACKEND_URL) {
    return <p>Set VITE_API_URL in react-frontend/.env.local.</p>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
