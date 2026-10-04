import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";
import "../styles/Register.css";

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

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
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

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
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
      await API.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      const role = response.data?.user?.role || "User";

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", role);

      if (role === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("GOOGLE REGISTER ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Google registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <aside className="register-showcase" aria-hidden="true">
        <div className="register-brand">
          <PawMark size={30} />
          <span>PawLand</span>
        </div>

        <div className="register-stage">
          <div className="register-tile register-tile-back" />
          <div className="register-tile register-tile-mid" />
          <div className="register-tile register-tile-front">
            <div className="register-tile-art">
              <PawMark size={86} />
            </div>
            <div className="register-tile-body">
              <strong>Luna</strong>
              <span>Domestic shorthair, 1 year</span>
              <em>Looking for a quiet, loving home</em>
            </div>
          </div>
        </div>

        <div className="register-copy">
          <h2>Start your adoption journey.</h2>
          <ul className="register-perks">
            <li><CheckIcon /> Apply to adopt in a few minutes</li>
            <li><CheckIcon /> Follow every application update</li>
            <li><CheckIcon /> Support local rescue work</li>
          </ul>
        </div>
      </aside>

      <main className="register-panel">
        <div className="register-card">
          <div className="register-mobile-brand">
            <PawMark size={26} />
            <span>PawLand</span>
          </div>

          <h1>Create your account</h1>
          <p className="register-subtitle">Join PawLand to adopt, foster and support animals in need.</p>

          {error && (
            <p className="register-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
            />

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
            <div className="register-password">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
              <button
                type="button"
                className="register-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            <p className="register-hint">Use 8 or more characters.</p>

            <button type="submit" className="register-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="register-divider">
            <span>or</span>
          </div>

          <div className="google-register">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google registration failed.")}
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <p className="register-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;