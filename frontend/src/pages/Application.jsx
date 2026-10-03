import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Application.css";

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  x: "M6 6l12 12M18 6L6 18",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
};

function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function Application() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchApplications = async () => {
    try {
      const res = await API.get("/applications/all");
      setApplications(res.data.applications);
    } catch (err) {
      console.error("FETCH APPLICATIONS ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load applications."
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

        if (userRes.data.user.role !== "Admin") {
          navigate("/dashboard", { replace: true });
          return;
        }

        await fetchApplications();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
        } else if (err.response?.status === 403) {
          navigate("/dashboard", { replace: true });
        } else {
          setError(err.response?.data?.message || "Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  const handleStatusChange = async (id, newStatus, note) => {
    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await API.put(`/applications/${id}/status`, {
        status: newStatus,
        adminNote: note !== undefined ? note : undefined,
      });

      setApplications((prev) =>
        prev.map((a) => (a._id === id ? res.data.application : a))
      );

      if (selectedApp && selectedApp._id === id) {
        setSelectedApp(res.data.application);
      }

      setSuccess(`Application marked as ${newStatus}.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (app) => {
    setSelectedApp(app);
    setAdminNote(app.adminNote || "");
  };

  const closeDetails = () => {
    setSelectedApp(null);
    setAdminNote("");
  };

  const filtered = applications.filter((a) => {
    const matchFilter = filter === "All" || a.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.pet?.name?.toLowerCase().includes(q);

    return matchFilter && matchSearch;
  });

  const counts = {
    All: applications.length,
    Pending: applications.filter((a) => a.status === "Pending").length,
    Approved: applications.filter((a) => a.status === "Approved").length,
    Rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  if (loading) {
    return (
      <div className="application-loading">
        <div className="application-spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  const renderActions = (app, note, withIcons = true) => {
    const busy = updatingId === app._id;

    return (
      <>
        {app.status !== "Approved" && (
          <button
            className="application-approve-btn"
            disabled={busy}
            onClick={() => handleStatusChange(app._id, "Approved", note)}
          >
            {withIcons && <Icon name="check" />} {busy ? "Saving..." : "Approve"}
          </button>
        )}

        {app.status !== "Rejected" && (
          <button
            className="application-reject-btn"
            disabled={busy}
            onClick={() => handleStatusChange(app._id, "Rejected", note)}
          >
            {withIcons && <Icon name="x" />} {busy ? "Saving..." : "Reject"}
          </button>
        )}

        {app.status !== "Pending" && (
          <button
            className="application-pending-btn"
            disabled={busy}
            onClick={() => handleStatusChange(app._id, "Pending", note)}
          >
            {withIcons && <Icon name="clock" />} {busy ? "Saving..." : "Set pending"}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="application-content">
      <section className="application-hero">
        <h1>Adoption applications.</h1>
        <p>Review applications from users, add a note, and update their status.</p>
      </section>

      {error && <p className="application-error" role="alert">{error}</p>}
      {success && <p className="application-success" role="status">{success}</p>}

      <section className="application-stats">
        {["All", "Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            className={`application-stat-card tone-${status.toLowerCase()} ${filter === status ? "active" : ""}`}
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            <span className="application-stat-value">{counts[status]}</span>
            <span className="application-stat-label">{status}</span>
          </button>
        ))}
      </section>

      <section className="application-toolbar">
        <div className="application-search-wrap">
          <Icon name="search" size={19} />
          <input
            type="text"
            placeholder="Search by applicant, email or pet"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="application-search"
            aria-label="Search applications"
          />
        </div>
        <p className="application-count">
          Showing <strong>{filtered.length}</strong> of {applications.length}
        </p>
      </section>

      <section className="application-list">
        {filtered.length === 0 ? (
          <div className="application-empty">
            <PawMark size={40} />
            <p>No applications found.</p>
          </div>
        ) : (
          filtered.map((app) => (
            <article key={app._id} className="application-card">
              <div className="application-card-pet">
                <div className="application-card-photo">
                  {app.pet?.image ? (
                    <img src={app.pet.image} alt={app.pet.name} />
                  ) : (
                    <div className="application-card-placeholder">
                      <PawMark size={44} />
                    </div>
                  )}
                </div>

                <div className="application-pet-info">
                  <span className="application-species">
                    {app.pet?.species || "Pet"}
                  </span>
                  <h3>{app.pet?.name || "Unknown pet"}</h3>
                  {app.pet?.location && (
                    <p>
                      <Icon name="pin" size={14} /> {app.pet.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="application-card-content">
                <div className="application-card-top">
                  <span className={`application-status application-status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                  <span className="application-date">
                    {new Date(app.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="application-applicant">
                  <span className="application-avatar">
                    {app.user?.profilePicture ? (
                      <img src={app.user.profilePicture} alt={app.user.name} />
                    ) : (
                      app.user?.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </span>
                  <div>
                    <p className="application-name">{app.user?.name || app.fullName}</p>
                    <p className="application-email">{app.user?.email || app.email}</p>
                  </div>
                </div>

                <div className="application-meta-grid">
                  <div>
                    <span className="application-label">Phone</span>
                    <p>{app.phone}</p>
                  </div>
                  <div>
                    <span className="application-label">Address</span>
                    <p>{app.address}</p>
                  </div>
                  <div>
                    <span className="application-label">Home type</span>
                    <p>{app.homeType}</p>
                  </div>
                  <div>
                    <span className="application-label">Has pets</span>
                    <p>{app.hasPets}</p>
                  </div>
                </div>

                <div className="application-reason">
                  <span className="application-label">Reason</span>
                  <p>{app.reason}</p>
                </div>

                {app.adminNote && (
                  <div className="application-admin-note">
                    <span className="application-label">Admin note</span>
                    <p>{app.adminNote}</p>
                  </div>
                )}

                <div className="application-card-actions">
                  <button className="application-view-btn" onClick={() => openDetails(app)}>
                    View details
                  </button>
                  {renderActions(app)}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Details modal */}
      {selectedApp && (
        <div className="application-modal-backdrop" onClick={closeDetails}>
          <div
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Application details"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="application-modal-close" onClick={closeDetails} aria-label="Close">
              <Icon name="close" size={18} />
            </button>

            <div className="application-modal-pet">
              {selectedApp.pet?.image ? (
                <img src={selectedApp.pet.image} alt={selectedApp.pet.name} />
              ) : (
                <div className="application-modal-placeholder">
                  <PawMark size={60} />
                </div>
              )}
            </div>

            <div className="application-modal-body">
              <div className="application-modal-top">
                <span className={`application-status application-status-${selectedApp.status.toLowerCase()}`}>
                  {selectedApp.status}
                </span>
                <span className="application-date">
                  {new Date(selectedApp.createdAt).toLocaleString()}
                </span>
              </div>

              <h2>Application for {selectedApp.pet?.name || "a pet"}</h2>

              <div className="application-modal-grid">
                <div>
                  <span className="application-label">Applicant</span>
                  <p>{selectedApp.user?.name || selectedApp.fullName}</p>
                </div>
                <div>
                  <span className="application-label">Email</span>
                  <p>{selectedApp.user?.email || selectedApp.email}</p>
                </div>
                <div>
                  <span className="application-label">Phone</span>
                  <p>{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="application-label">Address</span>
                  <p>{selectedApp.address}</p>
                </div>
                <div>
                  <span className="application-label">Home type</span>
                  <p>{selectedApp.homeType}</p>
                </div>
                <div>
                  <span className="application-label">Has pets</span>
                  <p>{selectedApp.hasPets}</p>
                </div>
              </div>

              <div className="application-modal-reason">
                <span className="application-label">Reason</span>
                <p>{selectedApp.reason}</p>
              </div>

              <div className="application-modal-note">
                <label htmlFor="adminNote">Admin note (optional)</label>
                <textarea
                  id="adminNote"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note about this application. The applicant can read it."
                  maxLength={500}
                />
                <span className="application-note-counter">{adminNote.length} / 500</span>
              </div>

              <div className="application-modal-actions">
                {renderActions(selectedApp, adminNote)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Application;