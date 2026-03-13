import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";
import { useAuth } from "../auth/useAuth";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    navigate("/", { replace: true });
    setBusy(false);
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <h1 className="login-brand-title">Repair Dashboard</h1>
          <p className="login-brand-subtitle">
            Sign in to manage inventory, customers, invoices, and purchases.
          </p>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">
              Enter your email and password to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <button
              type="submit"
              disabled={busy}
              className="button-primary login-submit"
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
