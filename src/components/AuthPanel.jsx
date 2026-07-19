import { useState } from "react";
import { supabase, hasSupabaseConfig } from "../supabaseClient";
import { isDemoSession, isFullAccess } from "../lib/accessControl";

export default function AuthPanel({
  session = null,
  access = null,
  navigate = null,
  onContinueOffline = null,
  offlineAvailable = false,
}) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  const signedIn = !!session?.user && !isDemoSession(session);
  const fullAccess = isFullAccess(access);
  const setError = (text) => setMsg({ text, type: "error" });
  const setSuccess = (text) => setMsg({ text, type: "success" });
  const clearMsg = () => setMsg({ text: "", type: "" });

  const ensureOnlineAuth = () => {
    if (!hasSupabaseConfig || !supabase) {
      setError("Account login is not configured yet. Demo mode still works, but paid unlock needs Supabase configured in Vercel.");
      return false;
    }
    if (!online) {
      setError("You are offline. Continue in demo mode for local and AI games.");
      return false;
    }
    return true;
  };

  async function startCheckout() {
    if (!ensureOnlineAuth()) return;
    if (!session?.access_token || !signedIn) {
      setError("Create an account or sign in first, then start checkout.");
      return;
    }

    setCheckoutLoading(true);
    clearMsg();
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error || "Checkout could not be started. Check Stripe env vars in Vercel.");
    } catch (_) {
      setError("Checkout could not be started. Check your Stripe/Vercel setup.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleLogout() {
    if (!ensureOnlineAuth()) return;
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate?.("home", {}, { replace: true });
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!ensureOnlineAuth()) return;
    setLoading(true);
    clearMsg();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) setError(error.message);
    else setSuccess("Signed in successfully. Use the upgrade button to unlock full access.");
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
      setError("Please choose a display name.");
      return;
    }

    setLoading(true);
    clearMsg();

    const finalEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: finalEmail,
      password,
      options: {
        data: { username: username.trim(), display_name: username.trim() },
        emailRedirectTo: window.location.origin,
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
          display_name: username.trim(),
          points: 0,
          crowns: 0,
          level: 1,
          wins: 0,
          losses: 0,
          is_online: true,
        },
        { onConflict: "id" }
      );
      setSuccess("Account created. Check your inbox if email confirmation is enabled, then sign in and start checkout.");
      setMode("login");
    }
    setLoading(false);
  }

  async function handlePasswordReset() {
    if (!ensureOnlineAuth()) return;
    if (!email.trim()) {
      setError("Enter your email first, then use password reset.");
      return;
    }
    setLoading(true);
    clearMsg();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setSuccess("Password reset email sent.");
    setLoading(false);
  }

  if (signedIn) {
    return (
      <div className="auth-wrapper">
        <div className="auth-panel account-panel">
          <div className="auth-logo">
            <span className="auth-logo-icon">🎮</span>
            <h1 className="auth-title">GamerTabs Account</h1>
            <p className="auth-subtitle">Signed in as {session.user.email}</p>
          </div>

          <div className={`auth-msg ${fullAccess ? "success" : "error"}`}>
            {fullAccess
              ? "Full access is active. Online rooms, friends, chat and cloud saves are unlocked."
              : access?.isExpired
                ? "Your subscription is expired. Your saved data is kept safe and will unlock again when payment resumes."
                : "You are signed in, but still in demo mode until checkout is completed."}
          </div>

          {!fullAccess && (
            <button className="auth-submit" type="button" onClick={startCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Opening Stripe checkout..." : "Upgrade / unlock full GamerTabs"}
            </button>
          )}

          <button className="auth-submit auth-offline-btn" type="button" onClick={() => navigate?.("home")}>
            Back to app
          </button>
          <button className="auth-link-button" type="button" onClick={handleLogout} disabled={loading}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-panel">
        <div className="auth-logo">
          <span className="auth-logo-icon">🎮</span>
          <h1 className="auth-title">GamerTabs Account</h1>
          <p className="auth-subtitle">Create an account first, then purchase to unlock full access on this same app URL.</p>
        </div>

        {!online && <div className="offline-banner">OFFLINE MODE ACTIVE</div>}

        <div className="commercial-auth-steps">
          <div><strong>1</strong><span>Sign in or create account</span></div>
          <div><strong>2</strong><span>Open Stripe checkout</span></div>
          <div><strong>3</strong><span>Return here and full mode unlocks</span></div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); clearMsg(); }}>Sign in</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); clearMsg(); }}>Create account</button>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label>Display name</label>
              <input type="text" placeholder="Choose a display name" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {msg.text && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          {mode === "login" && (
            <button type="button" className="auth-link-button" onClick={handlePasswordReset} disabled={loading}>Forgot password?</button>
          )}

          {offlineAvailable && (
            <button type="button" className="auth-submit auth-offline-btn" onClick={onContinueOffline}>Continue demo mode</button>
          )}
        </form>
      </div>
    </div>
  );
}
