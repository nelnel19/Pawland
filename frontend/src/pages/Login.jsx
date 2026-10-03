import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";
import "../styles/Login.css";

function PawMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" fill="currentColor">
      <ellipse cx="12" cy="30" rx="7" ry="9" transform="rotate(-18 12 30)" />
      <ellipse cx="26" cy="15" rx="7" ry="10" transform="rotate(-6 26 15)" />
      <ellipse cx="42" cy="15" rx="7" ry="10" transform="rotate(6 42 15)" />
      <ellipse cx="55" cy="30" rx="7" ry="9" transform="rotate(18 55 30)" />
      <path d="M32 29c-10 0-19 9-19 18 0 6 5 9 10 9 4 0 6-2 9-2s5 2 9 2c5 0 10-3 10-9 0-9-9-18-19-18z" />
    </svg>
  );
}

function EyeIcon({ off }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", form);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);

      if (response.data.user.role === "Admin") {
        navigate("/admin/reports", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    try {
      const response = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);

      if (response.data.user.role === "Admin") {
        navigate("/admin/reports", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed.");
    }
  };

  return (
    <div className="login-page">
      <aside className="login-showcase" aria-hidden="true">
        <div className="login-brand">
          <PawMark size={30} />
          <span>PawLand</span>
        </div>

        <div className="login-stage">
          <div className="login-tile login-tile-back" />
          <div className="login-tile login-tile-mid" />
          <div className="login-tile login-tile-front">
            <div className="login-tile-art">
              <PawMark size={86} />
            </div>
            <div className="login-tile-body">
              <strong>Biscuit</strong>
              <span>Beagle mix, 2 years</span>
              <em>Vaccinated and ready for a home</em>
            </div>
          </div>
        </div>

        <div className="login-copy">
          <h2>Every rescue ends with a home.</h2>
          <p>Track your applications, follow adoption updates, and stay connected with the animals waiting for you.</p>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <PawMark size={26} />
            <span>PawLand</span>
          </div>

          <h1>Welcome back</h1>
          <p className="login-subtitle">Log in to manage your adoptions and rescue activity.</p>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password</label>
            <div className="login-password">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="google-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed.")}
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <p className="login-footer">
            New to PawLand? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;