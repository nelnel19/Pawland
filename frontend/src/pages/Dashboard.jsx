import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Dashboard.css";

const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  megaphone: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6.5a8 8 0 010 11",
  report: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  mail: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 7 9-7",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

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

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await API.get("/dashboard");

        setUser(response.data.user);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
        } else {
          setError(
            err.response?.data?.message || "Failed to load dashboard."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-page">
        <div className="dashboard-error-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleLogout}>Back to login</button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initial = user.name?.charAt(0)?.toUpperCase() || "U";
  const firstName = user.name?.split(" ")[0] || "there";

  const renderAvatar = () =>
    user.profilePicture ? <img src={user.profilePicture} alt="Profile" /> : initial;

  const tiles = [
    { icon: "home", tone: "mint", title: "Adopt a pet", text: "Browse animals waiting for a forever home. Filter by species, gender and size.", cta: "View available pets", to: "/adoption" },
    { icon: "report", tone: "honey", title: "Report an animal", text: "Report abuse or a lost or found animal with a photo, location and description.", cta: "Submit a report", to: "/report" },
    { icon: "megaphone", tone: "sky", title: "Announcements", text: "Vaccination drives, clean-ups and safety advisories from your LGU and Barangay.", cta: "Read updates", to: "/announcement" },
    { icon: "list", tone: "clay", title: "My applications", text: "Follow the status of every adoption application you have submitted.", cta: "Track applications", to: "/my-applications" },
  ];

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "Report", to: "/report" },
    { label: "Announcements", to: "/announcement" },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="dashboard-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              className={`dashboard-nav-link${link.to === "/dashboard" ? " is-active" : ""}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-header-actions">
          <button className="dashboard-profile-button" onClick={() => navigate("/profile")}>
            <span className="header-avatar">{renderAvatar()}</span>
            <span className="dashboard-profile-label">My profile</span>
          </button>
          <button className="dashboard-logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <h1>Welcome back, {firstName}.</h1>
            <p>
              Every adoption, report and update you make helps an animal find safety. Pick up where you left off.
            </p>
            <div className="dashboard-hero-actions">
              <button className="dashboard-primary-btn" onClick={() => navigate("/adoption")}>
                Find a pet to adopt <Icon name="arrow" size={18} />
              </button>
              <button className="dashboard-ghost-btn" onClick={() => navigate("/report")}>
                Report an animal
              </button>
            </div>
          </div>

          <div className="dashboard-hero-visual" aria-hidden="true">
            <div className="dashboard-member-card">
              <div className="dashboard-member-top">
                <PawMark size={20} />
                <span>PawLand member</span>
              </div>
              <div className="dashboard-member-avatar">{renderAvatar()}</div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <h2>What would you like to do?</h2>
            <p>Everything you need to help animals in your community.</p>
          </div>

          <div className="dashboard-tiles">
            {tiles.map((tile) => (
              <button key={tile.to} className="dashboard-tile" onClick={() => navigate(tile.to)}>
                <span className={`dashboard-tile-icon tone-${tile.tone}`}>
                  <Icon name={tile.icon} />
                </span>
                <h3>{tile.title}</h3>
                <p>{tile.text}</p>
                <span className="dashboard-tile-cta">
                  {tile.cta} <Icon name="arrow" size={16} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-section dashboard-split">
          <div className="dashboard-profile-card">
            <div className="dashboard-card-heading">
              <h3>Profile information</h3>
              <button className="dashboard-edit-button" onClick={() => navigate("/profile")}>
                Edit profile
              </button>
            </div>

            <div className="dashboard-user-info">
              <div className="dashboard-avatar">{renderAvatar()}</div>
              <div className="dashboard-user-details">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <span className="dashboard-account-badge">PawLand member</span>
              </div>
            </div>

            <div className="dashboard-info-divider"></div>

            <div className="dashboard-info-row">
              <div className="dashboard-info-icon"><Icon name="user" size={18} /></div>
              <div>
                <span className="dashboard-info-label">Full name</span>
                <p>{user.name}</p>
              </div>
            </div>

            <div className="dashboard-info-row">
              <div className="dashboard-info-icon"><Icon name="mail" size={18} /></div>
              <div>
                <span className="dashboard-info-label">Email address</span>
                <p>{user.email}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-journey">
            <h3>How adoption works</h3>
            <ol>
              <li>
                <strong>Browse</strong>
                <span>Search available pets and read their stories.</span>
              </li>
              <li>
                <strong>Apply</strong>
                <span>Send a short application for the pet you love.</span>
              </li>
              <li>
                <strong>Meet and adopt</strong>
                <span>An admin reviews your application and arranges the next step.</span>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} PawLand. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Dashboard;