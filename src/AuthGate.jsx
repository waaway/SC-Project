import React, { useEffect, useState } from "react";
import { ShieldCheck, LockKeyhole, UserRound, Eye, EyeOff, LoaderCircle, Sun, Moon } from "lucide-react";
import "./auth.css";

export default function AuthGate({ children, onAuthenticated, theme = "dark", onToggleTheme }) {
  const [mode, setMode] = useState("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (!alive) return;
      if (data?.user) { onAuthenticated?.(data); setMode("authenticated"); }
      else setMode("login");
    }).catch(() => { if (alive) { setMode("error"); setError("Unable to connect to the server. Please check that the backend is running."); } });
    return () => { alive = false; };
  }, []);

  const submit = async e => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:username.trim(),password}) });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: response.status === 429 ? "Too many failed sign-in attempts. For your security, please wait 15 minutes before trying again." : "We couldn’t sign you in right now. Please try again shortly." };
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      onAuthenticated?.(data);
      setMode("authenticated");
    } catch (err) { setError(err.message || "An unexpected error occurred."); }
    finally { setBusy(false); }
  };

  if (mode === "authenticated") return children;
  return <div className="auth-screen"><button className="theme-toggle auth-theme-toggle icon-button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><span className="theme-toggle-icon">{theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}</span><span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span></button><div className="auth-geometry auth-geometry-one"/><div className="auth-geometry auth-geometry-two"/>
    <section className="auth-brand-panel">
      <div className="ecq-wordmark"><img src="/images/ecq-logo.svg" alt="ECQ" /></div>
      <div className="brand-divider"/>
      <div className="auth-product-name">SC CONTROL</div>
      
      <div className="auth-brand-footer">ECQ SC Control Center <span>v1.0.0</span></div>
    </section>
    <div className="auth-card">
      {mode === "loading" ? <div className="auth-loading"><LoaderCircle className="spin" size={24}/><p>Checking session...</p></div> : <>
        <h1>{mode === "error" ? "Server unavailable" : "Sign in to SC CONTROL"}</h1>
        <p className="auth-subtitle">{mode === "error" ? "SC Control Center requires a connection to the backend." : "Welcome! Please enter your email and password"}</p>
        {mode === "error" ? <div className="auth-error">{error}<button onClick={() => location.reload()}>Try again</button></div> : <form className="auth-form" onSubmit={submit}>
          <label>Email<div className="auth-input-wrap"><UserRound size={17}/><input required minLength={3} maxLength={40} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your email"/></div></label>
          <label>Password<div className="auth-input-wrap"><LockKeyhole size={17}/><input required maxLength={128} autoComplete="current-password" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<LockKeyhole size={16}/>} {busy?"Signing in...":"Sign in"} <span>→</span></button>
        </form>}
      </>}
      
    </div>
  </div>;
}
