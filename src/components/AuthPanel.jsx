import { useState } from "react";
import { supabase, hasSupabaseConfig } from "../supabaseClient";

export default function AuthPanel({
  onContinueOffline = null,
  offlineAvailable = false,
}) {
  const [mode, setMode] = useState("login");

  const [identity, setIdentity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const online =
    typeof navigator === "undefined" ? true : navigator.onLine;

  const setError = (text) => setMsg({ text, type: "error" });
  const setSuccess = (text) => setMsg({ text, type: "success" });

  function clearMsg() {
    setMsg({ text: "", type: "" });
  }

  const ensureOnlineAuth = () => {
    if (!hasSupabaseConfig || !supabase) {
      setError(
        "Online multiplayer is unavailable right now. You can still continue offline."
      );
      return false;
    }

    if (!online) {
      setError(
        "You are offline. Continue Offline to play local and AI games."
      );
      return false;
    }

    return true;
  };

  async function handleLogin(e) {
    e.preventDefault();

    if (!ensureOnlineAuth()) return;

    setLoading(true);
    clearMsg();

    let loginEmail = identity.trim();

    // allow username-style login
    if (!loginEmail.includes("@")) {
      loginEmail = `${identity.trim().toLowerCase()}@blackvault.local`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Signed in successfully.");
    }

    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();

    if (!ensureOnlineAuth()) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }

    setLoading(true);
    clearMsg();

    // generate hidden email if user does not supply one
    const finalEmail =
      email.trim() ||
      `${username.trim().toLowerCase()}@blackvault.local`;

    const { data, error } = await supabase.auth.signUp({
      email: finalEmail,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          username: username.trim(),
          email: finalEmail,
          points: 0,
          crowns: 0,
          level: 1,
          wins: 0,
          losses: 0,
          is_online: true,
        },
        { onConflict: "id" }
      );

      setSuccess(
        "Account created successfully. You can now sign in."
      );

      setMode("login");
      setIdentity(username.trim());
    }

    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-panel">
        <div className="auth-logo">
          <span className="auth-logo-icon">🏛️</span>
          <h1 className="auth-title">GamerTab</h1>
          <p className="auth-subtitle">Black Vault</p>
        </div>

        {!online && (
          <div className="offline-banner">
            OFFLINE MODE ACTIVE
          </div>
        )}

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              clearMsg();
            }}
          >
            Sign In
          </button>

          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              clearMsg();
            }}
          >
            Register
          </button>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className="auth-form"
        >
          {mode === "register" && (
            <>
              <div className="form-group">
                <label>Username</label>

                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={24}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email (optional)</label>

                <input
                  type="email"
                  placeholder="Optional email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === "login" && (
            <div className="form-group">
              <label>Username or Email</label>

              <input
                type="text"
                placeholder="Username or email"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder={
                mode === "register"
                  ? "Minimum 6 characters"
                  : "Your password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {msg.text && (
            <div className={`auth-msg ${msg.type}`}>
              {msg.text}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Enter Vault"
              : "Create Account"}
          </button>

          {offlineAvailable && (
            <button
              type="button"
              className="auth-submit auth-offline-btn"
              onClick={onContinueOffline}
            >
              Continue Offline
            </button>
          )}
        </form>
      </div>
    </div>
  );
}