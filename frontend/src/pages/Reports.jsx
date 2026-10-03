import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Reports.css";

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
};

function Icon({ name, size = 16 }) {
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

const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");

function Reports() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await API.get("/dashboard");
        setUser(userRes.data.user);

        // Guard: only admins can view this page
        if (userRes.data.user.role !== "Admin") {
          navigate("/dashboard", { replace: true });
          return;
        }

        const reportsRes = await API.get("/reports/all");
        setReports(reportsRes.data.reports);
      } catch (err) {
        console.error("ADMIN REPORTS ERROR:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
        } else if (err.response?.status === 403) {
          navigate("/dashboard", { replace: true });
        } else {
          setError(
            err.response?.data?.message || "Failed to load reports."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    setError("");

    try {
      const response = await API.put(`/reports/${reportId}/status`, {
        status: newStatus,
      });

      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId
            ? { ...r, status: response.data.report.status }
            : r
        )
      );
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to update report status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesFilter = filter === "All" || r.status === filter;
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      r.title.toLowerCase().includes(searchTerm) ||
      r.animalType.toLowerCase().includes(searchTerm) ||
      r.location.toLowerCase().includes(searchTerm) ||
      r.user?.name?.toLowerCase().includes(searchTerm) ||
      r.user?.email?.toLowerCase().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    All: reports.length,
    Pending: reports.filter((r) => r.status === "Pending").length,
    "In Progress": reports.filter((r) => r.status === "In Progress").length,
    Resolved: reports.filter((r) => r.status === "Resolved").length,
    Rejected: reports.filter((r) => r.status === "Rejected").length,
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="reports-error-card">
        <h2>Something went wrong</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="reports-content">
      <section className="reports-hero">
        <h1>All reports.</h1>
        <p>Review every animal report submitted by users and track it to resolution.</p>
      </section>

      {error && <p className="reports-inline-error" role="alert">{error}</p>}

      <section className="reports-stats">
        {["All", ...STATUSES].map((status) => (
          <button
            key={status}
            className={`reports-stat-card tone-${slug(status)} ${filter === status ? "active" : ""}`}
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            <span className="reports-stat-value">{statusCounts[status]}</span>
            <span className="reports-stat-label">{status}</span>
          </button>
        ))}
      </section>

      <section className="reports-toolbar">
        <div className="reports-search-wrap">
          <Icon name="search" size={19} />
          <input
            type="text"
            className="reports-search"
            placeholder="Search by title, animal, location or user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reports"
          />
        </div>
        <p className="reports-count">
          Showing <strong>{filteredReports.length}</strong> of {reports.length}
        </p>
      </section>

      <section className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="reports-empty">
            <PawMark size={40} />
            <p>No reports found.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <article key={report._id} className="reports-card">
              <div className="reports-card-image">
                {report.image ? (
                  <img src={report.image} alt={report.title} />
                ) : (
                  <div className="reports-card-placeholder">
                    <PawMark size={44} />
                  </div>
                )}
              </div>

              <div className="reports-card-body">
                <div className="reports-card-top">
                  <span className="reports-type-badge">{report.reportType}</span>
                  <span className={`reports-status-badge reports-status-${slug(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <h3 className="reports-card-title">{report.title}</h3>

                <div className="reports-card-meta">
                  <p>
                    <PawMark size={15} /> <span>{report.animalType}</span>
                  </p>
                  <p>
                    <Icon name="pin" /> <span>{report.location}</span>
                  </p>
                  {report.contactNumber && (
                    <p>
                      <Icon name="phone" /> <span>{report.contactNumber}</span>
                    </p>
                  )}
                  <p>
                    <Icon name="user" />
                    <span>
                      {report.user?.name || "Unknown"}
                      {report.user?.email && (
                        <em className="reports-user-email"> ({report.user.email})</em>
                      )}
                    </span>
                  </p>
                </div>

                <p className="reports-card-desc">{report.description}</p>

                <p className="reports-date">
                  Submitted {new Date(report.createdAt).toLocaleString()}
                </p>

                <div className="reports-card-actions">
                  <span className="reports-actions-label">
                    Update status
                    {updatingId === report._id && (
                      <em className="reports-updating">Updating...</em>
                    )}
                  </span>

                  <div className="reports-segmented" role="group" aria-label="Update status">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`reports-seg tone-${slug(s)}${report.status === s ? " is-active" : ""}`}
                        aria-pressed={report.status === s}
                        disabled={updatingId === report._id}
                        onClick={() => report.status !== s && handleStatusChange(report._id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Reports;