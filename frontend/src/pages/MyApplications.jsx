import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/MyApplications.css";

const ICONS = {
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  close: "M6 6l12 12M18 6L6 18",
  note: "M5 4h14a1 1 0 011 1v10l-5 5H5a1 1 0 01-1-1V5a1 1 0 011-1zM15 20v-5h5M8 9h8M8 13h4",
};

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

function Icon({ name, size = 18 }) {
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

function MyApplications() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState("All");

  const fetchApplications = async () => {
    try {
      const res = await API.get("/applications/my");
      setApplications(res.data.applications);
    } catch (err) {
      console.error("FETCH MY APPLICATIONS ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load your applications."
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const bootstrap = async () => {
      try {
        const userRes = await API.get("/dashboard");
        setUser(userRes.data.user);
        await fetchApplications();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
        } else {
          setError(err.response?.data?.message || "Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this application?")) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await API.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      setSuccess("Application cancelled.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to cancel application."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-applications-loading">
        <div className="my-applications-spinner"></div>
        <p>Loading your applications...</p>
      </div>
    );
  }

  const count = (s) => applications.filter((a) => a.status === s).length;
  const visible =
    filter === "All" ? applications : applications.filter((a) => a.status === filter);

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "My applications", to: "/my-applications" },
    { label: "Report", to: "/report" },
  ];

  return (
    <div className="my-applications-page">
      <header className="my-applications-header">
        <div className="my-applications-brand">
          <div className="my-applications-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="my-applications-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              className={`my-applications-nav-btn${link.to === "/my-applications" ? " is-active" : ""}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="my-applications-header-actions">
          <button className="my-applications-profile-btn" onClick={() => navigate("/profile")}>
            <span className="my-applications-header-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </span>
            <span className="my-applications-profile-label">{user?.name || "Profile"}</span>
          </button>
          <button className="my-applications-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="my-applications-main">
        <section className="my-applications-hero">
          <div className="my-applications-hero-copy">
            <h1>Your adoption applications.</h1>
            <p>Follow every application from review to decision, and read notes from our team.</p>
          </div>

          <div className="my-applications-stats">
            <div><strong>{applications.length}</strong><span>Total</span></div>
            <div><strong>{count("Pending")}</strong><span>Pending</span></div>
            <div><strong>{count("Approved")}</strong><span>Approved</span></div>
          </div>
        </section>

        {error && <p className="my-applications-error" role="alert">{error}</p>}
        {success && <p className="my-applications-success" role="status">{success}</p>}

        {applications.length > 0 && (
          <div className="my-applications-chips" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`my-applications-chip${filter === f ? " is-active" : ""}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <section className="my-applications-list">
          {applications.length === 0 ? (
            <div className="my-applications-empty">
              <PawMark size={44} />
              <h3>No applications yet</h3>
              <p>You haven't submitted any adoption applications yet.</p>
              <button
                className="my-applications-browse-btn"
                onClick={() => navigate("/adoption")}
              >
                Browse pets
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="my-applications-empty">
              <h3>No {filter.toLowerCase()} applications</h3>
              <p>Try another status filter.</p>
            </div>
          ) : (
            visible.map((app) => (
              <article key={app._id} className="my-applications-card">
                <div className="my-applications-card-pet">
                  {app.pet?.image ? (
                    <img src={app.pet.image} alt={app.pet.name} />
                  ) : (
                    <div className="my-applications-placeholder">
                      <PawMark size={48} />
                    </div>
                  )}
                </div>

                <div className="my-applications-card-content">
                  <div className="my-applications-card-top">
                    <span
                      className={`my-applications-status my-applications-status-${app.status.toLowerCase()}`}
                    >
                      {app.status}
                    </span>
                    <span className="my-applications-date">
                      {new Date(app.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3>
                    {app.pet?.name || "Unknown pet"}
                    {app.pet?.species && (
                      <span className="my-applications-species">{app.pet.species}</span>
                    )}
                  </h3>

                  <p className="my-applications-meta">
                    {app.pet?.breed ? `${app.pet.breed}, ` : ""}
                    <Icon name="pin" size={14} /> {app.pet?.location || "Location not listed"}
                  </p>

                  <div className="my-applications-details">
                    <div>
                      <span className="my-applications-label">Phone</span>
                      <p>{app.phone}</p>
                    </div>
                    <div>
                      <span className="my-applications-label">Home type</span>
                      <p>{app.homeType}</p>
                    </div>
                  </div>

                  {app.adminNote && (
                    <div className="my-applications-admin-note">
                      <span className="my-applications-label">
                        <Icon name="note" size={14} /> Note from admin
                      </span>
                      <p>{app.adminNote}</p>
                    </div>
                  )}

                  <div className="my-applications-card-actions">
                    <button
                      className="my-applications-view-btn"
                      onClick={() => setSelectedApp(app)}
                    >
                      View details
                    </button>

                    {app.status === "Pending" && (
                      <button
                        className="my-applications-cancel-btn"
                        disabled={deletingId === app._id}
                        onClick={() => handleCancel(app._id)}
                      >
                        {deletingId === app._id ? "Cancelling..." : "Cancel application"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {selectedApp && (
        <div
          className="my-applications-modal-backdrop"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="my-applications-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Application details"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="my-applications-modal-close"
              onClick={() => setSelectedApp(null)}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>

            <div className="my-applications-modal-body">
              <div className="my-applications-card-top my-applications-modal-top">
                <span
                  className={`my-applications-status my-applications-status-${selectedApp.status.toLowerCase()}`}
                >
                  {selectedApp.status}
                </span>
                <span className="my-applications-date">
                  {new Date(selectedApp.createdAt).toLocaleString()}
                </span>
              </div>

              <h2>Application for {selectedApp.pet?.name || "a pet"}</h2>

              <div className="my-applications-modal-grid">
                <div>
                  <span className="my-applications-label">Full name</span>
                  <p>{selectedApp.fullName}</p>
                </div>
                <div>
                  <span className="my-applications-label">Email</span>
                  <p>{selectedApp.email}</p>
                </div>
                <div>
                  <span className="my-applications-label">Phone</span>
                  <p>{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="my-applications-label">Address</span>
                  <p>{selectedApp.address}</p>
                </div>
                <div>
                  <span className="my-applications-label">Home type</span>
                  <p>{selectedApp.homeType}</p>
                </div>
                <div>
                  <span className="my-applications-label">Has pets</span>
                  <p>{selectedApp.hasPets}</p>
                </div>
              </div>

              <div className="my-applications-reason">
                <span className="my-applications-label">Reason</span>
                <p>{selectedApp.reason}</p>
              </div>

              {selectedApp.adminNote && (
                <div className="my-applications-admin-note">
                  <span className="my-applications-label">
                    <Icon name="note" size={14} /> Note from admin
                  </span>
                  <p>{selectedApp.adminNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="my-applications-footer">
        <p>© {new Date().getFullYear()} PawLand. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default MyApplications;