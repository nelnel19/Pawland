import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "../styles/Adminpanel.css";

const ICONS = {
  dashboard: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6",
  animals: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  reports: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4",
  applications: "M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V8l-4-5zM14 3v5h5M9 14l2 2 4-4",
  announcements: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6.5a8 8 0 010 11",
  logout: "M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
};

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
  { label: "User Management", path: "/admin/users", icon: "users" },
  { label: "Animal Record Management", path: "/admin/animals", icon: "animals" },
  { label: "Reports Management", path: "/admin/reports", icon: "reports" },
  { label: "Application Management", path: "/admin/applications", icon: "applications" },
  { label: "Announcements", path: "/admin/announcements", icon: "announcements" },
];

function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function PawMark({ size = 24 }) {
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

function Adminpanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const activeItem = navItems.find((i) => isActivePath(i.path)) || navItems[0];

  return (
    <div className="adminpanel-layout">
      <aside className={`adminpanel-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="adminpanel-brand">
          <div className="adminpanel-logo">
            <PawMark size={24} />
          </div>
          <div className="adminpanel-brand-text">
            <span className="adminpanel-brand-name">PawLand</span>
            <span className="adminpanel-brand-role">Admin Panel</span>
          </div>
          <button
            className="adminpanel-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <span className="adminpanel-nav-title">Manage</span>

        <nav className="adminpanel-nav" aria-label="Admin">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);

            return (
              <button
                key={item.path}
                className={`adminpanel-nav-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="adminpanel-nav-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="adminpanel-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="adminpanel-sidebar-footer">
          <button className="adminpanel-logout-btn" onClick={handleLogout}>
            <span className="adminpanel-nav-icon">
              <Icon name="logout" />
            </span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="adminpanel-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="adminpanel-main">
        <header className="adminpanel-topbar">
          <button
            className="adminpanel-toggle-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <Icon name="menu" />
          </button>

          <div className="adminpanel-topbar-heading">
            <span className="adminpanel-crumb">Admin</span>
            <h1 className="adminpanel-topbar-title">{activeItem.label}</h1>
          </div>

          <span className="adminpanel-role-pill">Administrator</span>
        </header>

        <main className="adminpanel-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Adminpanel;