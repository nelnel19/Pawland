import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Profile.css";

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

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profilePicture: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await API.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile({
          name: response.data.user.name || "",
          email: response.data.user.email || "",
          profilePicture:
            response.data.user.profilePicture || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setMessage("");
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const undoImage = () => {
    setSelectedImage(null);
    setPreview("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("name", profile.name);
      formData.append("email", profile.email);

      if (selectedImage) {
        formData.append("profilePicture", selectedImage);
      }

      const response = await API.put(
        "/auth/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;

      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture || "",
      });

      setSelectedImage(null);
      setPreview("");
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc = preview || profile.profilePicture;

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "My applications", to: "/my-applications" },
    { label: "Report", to: "/report" },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-brand">
          <div className="profile-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="profile-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              type="button"
              className="profile-nav-btn"
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button type="button" className="profile-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="profile-main">
        <aside className="profile-summary">
          <div className="profile-member-card" aria-hidden="true">
            <div className="profile-member-top">
              <PawMark size={20} />
              <span>PawLand member</span>
            </div>
            <div className="profile-member-avatar">
              {avatarSrc ? <img src={avatarSrc} alt="" /> : initial}
            </div>
            <strong>{profile.name || "Your name"}</strong>
            <span>{profile.email || "your@email.com"}</span>
          </div>

          <p className="profile-summary-note">
            This is how your account appears across PawLand. Changes show here as you type.
          </p>
        </aside>

        <div className="profile-card">
          <h1>My profile</h1>
          <p className="profile-subtitle">
            Manage your PawLand account information.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="profile-picture-section">
              <div className="profile-avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              <div className="profile-picture-actions">
                <label htmlFor="profilePicture" className="profile-upload-button">
                  <CameraIcon /> Change picture
                </label>
                {preview && (
                  <button type="button" className="profile-undo-button" onClick={undoImage}>
                    Undo
                  </button>
                )}
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
                <small>JPG, PNG or other image formats, up to 5 MB</small>
              </div>
            </div>

            {message && (
              <div className="profile-message" role="status">{message}</div>
            )}

            {error && (
              <div className="profile-error" role="alert">{error}</div>
            )}

            <div className="profile-form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Profile;