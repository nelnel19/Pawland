import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Announcement.css";

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  megaphone: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6.5a8 8 0 010 11",
  pin: "M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z",
  close: "M6 6l12 12M18 6L6 18",
};

const CATEGORIES = ["All", "LGU", "Barangay", "Health", "Safety", "Event", "Other"];

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

function Announcement() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

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

        const res = await API.get("/announcements");
        setAnnouncements(res.data.announcements);
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

  const filtered = announcements
    .filter((a) => {
      const matchCategory =
        filterCategory === "All" || a.category === filterCategory;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    })
    // Pinned announcements first, original order otherwise
    .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned));

  const hasFilters = filterCategory !== "All" || search.trim();

  const clearFilters = () => {
    setFilterCategory("All");
    setSearch("");
  };

  const catClass = (c) => `announcement-category announcement-cat-${(c || "other").toLowerCase()}`;

  if (loading) {
    return (
      <div className="announcement-loading">
        <div className="announcement-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "My applications", to: "/my-applications" },
    { label: "Announcements", to: "/announcement" },
  ];

  return (
    <div className="announcement-page">
      <header className="announcement-header">
        <div className="announcement-brand">
          <div className="announcement-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="announcement-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              className={`announcement-nav-btn${link.to === "/announcement" ? " is-active" : ""}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="announcement-header-actions">
          <button className="announcement-profile-btn" onClick={() => navigate("/profile")}>
            <span className="announcement-header-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </span>
            <span className="announcement-profile-label">{user?.name || "Profile"}</span>
          </button>
          <button className="announcement-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="announcement-main">
        <section className="announcement-hero">
          <div className="announcement-hero-icon" aria-hidden="true">
            <Icon name="megaphone" size={34} />
          </div>
          <div>
            <h1>LGU and Barangay announcements.</h1>
            <p>
              Vaccination drives, clean-ups, safety advisories and events from your local government and barangay, all in one place.
            </p>
          </div>
        </section>

        {error && <p className="announcement-error" role="alert">{error}</p>}

        <section className="announcement-filters">
          <div className="announcement-search-wrap">
            <Icon name="search" size={19} />
            <input
              type="text"
              placeholder="Search title, source or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="announcement-search"
              aria-label="Search announcements"
            />
          </div>

          <div className="announcement-chips" role="group" aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`announcement-chip${filterCategory === c ? " is-active" : ""}`}
                aria-pressed={filterCategory === c}
                onClick={() => setFilterCategory(c)}
              >
                {c === "All" ? "All categories" : c}
              </button>
            ))}
          </div>
        </section>

        <div className="announcement-results-bar">
          <p>
            Showing <strong>{filtered.length}</strong> of {announcements.length} announcements
          </p>
          {hasFilters && (
            <button className="announcement-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <section className="announcement-grid-section">
          {filtered.length === 0 ? (
            <div className="announcement-empty">
              <PawMark size={40} />
              <h3>No announcements found</h3>
              <p>Try another category or clear your search.</p>
            </div>
          ) : (
            <div className="announcement-grid">
              {filtered.map((item) => (
                <article
                  key={item._id}
                  className={`announcement-card ${
                    item.isPinned ? "announcement-card-pinned" : ""
                  }`}
                  onClick={() => setSelected(item)}
                >
                  {item.image ? (
                    <div className="announcement-card-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  ) : (
                    <div className="announcement-card-image announcement-card-placeholder">
                      <Icon name="megaphone" size={44} />
                    </div>
                  )}

                  <div className="announcement-card-body">
                    <div className="announcement-card-top">
                      <span className={catClass(item.category)}>{item.category}</span>
                      {item.isPinned && (
                        <span className="announcement-pinned">
                          <Icon name="pin" size={13} /> Pinned
                        </span>
                      )}
                    </div>

                    <h3>{item.title}</h3>
                    <p className="announcement-source">
                      {item.source}
                      {item.location ? `, ${item.location}` : ""}
                    </p>
                    <p className="announcement-desc">{item.content}</p>
                    <p className="announcement-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div
          className="announcement-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="announcement-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>

            {selected.image ? (
              <img
                src={selected.image}
                alt={selected.title}
                className="announcement-modal-image"
              />
            ) : (
              <div className="announcement-modal-placeholder">
                <Icon name="megaphone" size={56} />
              </div>
            )}

            <div className="announcement-modal-body">
              <div className="announcement-modal-top">
                <span className={catClass(selected.category)}>{selected.category}</span>
                {selected.isPinned && (
                  <span className="announcement-pinned">
                    <Icon name="pin" size={13} /> Pinned
                  </span>
                )}
              </div>

              <h2>{selected.title}</h2>

              <div className="announcement-modal-meta">
                <p>
                  <span>Source</span> {selected.source}
                </p>
                {selected.location && (
                  <p>
                    <span>Location</span> {selected.location}
                  </p>
                )}
                <p>
                  <span>Posted</span> {new Date(selected.createdAt).toLocaleString()}
                </p>
                {selected.postedBy?.name && (
                  <p>
                    <span>Posted by</span> {selected.postedBy.name}
                  </p>
                )}
              </div>

              <div className="announcement-modal-content">
                <p>{selected.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="announcement-footer">
        <p>© {new Date().getFullYear()} PawLand. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Announcement;