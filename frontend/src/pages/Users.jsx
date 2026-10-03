import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Users.css";

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Users() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "User",
  });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      setError(err.response?.data?.message || "Failed to load users.");
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
        setCurrentUser(userRes.data.user);

        if (userRes.data.user.role !== "Admin") {
          navigate("/dashboard", { replace: true });
          return;
        }

        await fetchUsers();
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

  const handleRoleChange = async (id, newRole) => {
    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await API.put(`/users/${id}/role`, { role: newRole });

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? res.data.user : u))
      );

      setSuccess(`Role updated to ${newRole}.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;

    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setSuccess("User deleted.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setNewPassword("");
  };

  const closeEdit = () => {
    setSelectedUser(null);
    setEditForm({ name: "", email: "", role: "User" });
    setNewPassword("");
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await API.put(`/users/${selectedUser._id}`, {
        name: editForm.name,
        email: editForm.email,
      });

      let updatedUser = res.data.user;

      if (editForm.role !== selectedUser.role) {
        const roleRes = await API.put(
          `/users/${selectedUser._id}/role`,
          { role: editForm.role }
        );
        updatedUser = roleRes.data.user;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? updatedUser : u))
      );

      setSuccess("User updated successfully.");
      closeEdit();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await API.put(`/users/${selectedUser._id}/password`, {
        password: newPassword,
      });

      setSuccess("Password reset successfully.");
      setNewPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "All" || u.role === filterRole;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);

    return matchRole && matchSearch;
  });

  const counts = {
    All: users.length,
    User: users.filter((u) => u.role === "User").length,
    Admin: users.filter((u) => u.role === "Admin").length,
  };

  const statCards = [
    { role: "All", label: "All accounts", icon: "users" },
    { role: "User", label: "Users", icon: "user" },
    { role: "Admin", label: "Admins", icon: "shield" },
  ];

  if (loading) {
    return (
      <div className="users-loading">
        <div className="users-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-content">
      <section className="users-hero">
        <h1>User management.</h1>
        <p>View, edit and manage every registered PawLand account.</p>
      </section>

      {error && <p className="users-error" role="alert">{error}</p>}
      {success && <p className="users-success" role="status">{success}</p>}

      <section className="users-stats">
        {statCards.map((s) => (
          <button
            key={s.role}
            className={`users-stat-card ${filterRole === s.role ? "active" : ""}`}
            aria-pressed={filterRole === s.role}
            onClick={() => setFilterRole(s.role)}
          >
            <span className="users-stat-icon"><Icon name={s.icon} size={22} /></span>
            <span className="users-stat-text">
              <span className="users-stat-value">{counts[s.role]}</span>
              <span className="users-stat-label">{s.label}</span>
            </span>
          </button>
        ))}
      </section>

      <section className="users-panel">
        <div className="users-toolbar">
          <div className="users-search-wrap">
            <Icon name="search" size={19} />
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="users-search"
              aria-label="Search users"
            />
          </div>
          <p className="users-count">
            Showing <strong>{filtered.length}</strong> of {users.length}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="users-empty">
            <Icon name="users" size={34} />
            <p>No users found.</p>
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = currentUser?._id === u._id;

                  return (
                    <tr key={u._id}>
                      <td data-label="User">
                        <div className="users-user-cell">
                          <span className="users-avatar">
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt={u.name} />
                            ) : (
                              u.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </span>
                          <div>
                            <p className="users-name">
                              {u.name}
                              {isSelf && <span className="users-you-badge">You</span>}
                            </p>
                            {u.googleId && <p className="users-google">Google account</p>}
                          </div>
                        </div>
                      </td>
                      <td data-label="Email" className="users-cell-email">{u.email}</td>
                      <td data-label="Role">
                        <select
                          className={`users-role-select users-role-${u.role.toLowerCase()}`}
                          value={u.role}
                          disabled={updatingId === u._id || isSelf}
                          aria-label={`Role for ${u.name}`}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td data-label="Joined" className="users-cell-date">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td data-label="Actions">
                        <div className="users-actions">
                          <button className="users-edit-btn" onClick={() => openEdit(u)}>
                            <Icon name="edit" size={15} /> Edit
                          </button>
                          <button
                            className="users-delete-btn"
                            disabled={isSelf}
                            onClick={() => handleDelete(u._id)}
                          >
                            <Icon name="trash" size={15} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit user modal */}
      {selectedUser && (
        <div className="users-modal-backdrop" onClick={closeEdit}>
          <div
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="users-modal-close" onClick={closeEdit} aria-label="Close">
              <Icon name="close" />
            </button>

            <div className="users-modal-body">
              <h2>Edit user</h2>
              <p className="users-modal-subtitle">
                Update details for <strong>{selectedUser.email}</strong>
              </p>

              <form onSubmit={handleSaveEdit} className="users-edit-form">
                <label htmlFor="edit-name">Full name</label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  maxLength={100}
                  required
                />

                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />

                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  disabled={currentUser?._id === selectedUser._id}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>

                <div className="users-edit-actions">
                  <button type="button" className="users-cancel-btn" onClick={closeEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="users-save-btn" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>

              <div className="users-password-section">
                <h3>Reset password</h3>
                <p className="users-password-note">
                  Leave blank to keep the current password.
                </p>

                <div className="users-password-row">
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="users-reset-password-btn"
                    onClick={handleResetPassword}
                    disabled={saving || !newPassword}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;