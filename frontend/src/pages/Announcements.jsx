import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Announcements.css";

const emptyForm = {
  title: "",
  category: "LGU",
  source: "",
  content: "",
  location: "",
  isPinned: false,
};

const CATEGORIES = ["All", "LGU", "Barangay", "Health", "Safety", "Event", "Other"];

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  pin: "M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z",
  megaphone: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6.5a8 8 0 010 11",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const catClass = (c) => `announcements-category announcements-cat-${(c || "other").toLowerCase()}`;

function Announcements() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get("/announcements");
      setAnnouncements(res.data.announcements);
    } catch (err) {
      console.error("FETCH ANNOUNCEMENTS ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load announcements."
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

        await fetchAnnouncements();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      setImagePreview("");
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImage(null);
    setImagePreview("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (image) formData.append("image", image);

      if (editingId) {
        await API.put(`/announcements/${editingId}`, formData);
        setSuccess("Announcement updated successfully!");
      } else {
        await API.post("/announcements", formData);
        setSuccess("Announcement published successfully!");
      }

      resetForm();
      fetchAnnouncements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("SAVE ANNOUNCEMENT ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to save announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      category: item.category,
      source: item.source,
      content: item.content,
      location: item.location || "",
      isPinned: item.isPinned,
    });
    setImage(null);
    setImagePreview(item.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      await API.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setSuccess("Announcement deleted.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete announcement."
      );
    }
  };

  const filtered = announcements.filter((a) => {
    const matchCategory =
      filterCategory === "All" || a.category === filterCategory;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="announcements-loading">
        <div className="announcements-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  return (
    <div className="announcements-content">
      <section className="announcements-hero">
        <div className="announcements-hero-copy">
          <h1>Announcements.</h1>
          <p>Publish LGU and Barangay announcements that every user can see.</p>
        </div>

        <div className="announcements-stats">
          <div>
            <strong>{announcements.length}</strong>
            <span>Published</span>
          </div>
          <div>
            <strong>{pinnedCount}</strong>
            <span>Pinned</span>
          </div>
        </div>
      </section>

      {error && <p className="announcements-error" role="alert">{error}</p>}
      {success && <p className="announcements-success" role="status">{success}</p>}

      <section className="announcements-form-section">
        <div className="announcements-form-head">
          <div>
            <h2>{editingId ? "Edit announcement" : "New announcement"}</h2>
            <p>
              {editingId
                ? "Update the details below and save your changes."
                : "Fields marked with * are required."}
            </p>
          </div>
          {editingId && <span className="announcements-editing-badge">Editing</span>}
        </div>

        <form className="announcements-form" onSubmit={handleSubmit}>
          <div className="announcements-form-grid">
            <div>
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Free Anti-Rabies Vaccination"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="LGU">LGU</option>
                <option value="Barangay">Barangay</option>
                <option value="Health">Health</option>
                <option value="Safety">Safety</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="source">Source / office *</label>
              <input
                id="source"
                name="source"
                type="text"
                placeholder="e.g. Barangay San Isidro"
                value={form.source}
                onChange={handleChange}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Covered Court, Purok 3"
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            rows={6}
            placeholder="Write the announcement details here."
            value={form.content}
            onChange={handleChange}
            maxLength={3000}
            required
          />
          <span className="announcements-counter">{form.content.length} / 3000</span>

          <span className="announcements-label">Attach image (optional)</span>
          {imagePreview ? (
            <div className="announcements-image-preview">
              <img src={imagePreview} alt="Preview" />
              <label htmlFor="image" className="announcements-replace">
                <Icon name="upload" size={16} /> Replace image
              </label>
            </div>
          ) : (
            <label htmlFor="image" className="announcements-dropzone">
              <Icon name="upload" size={26} />
              <strong>Choose an image</strong>
              <span>JPG, PNG, WEBP or GIF</span>
            </label>
          )}
          <input
            id="image"
            name="image"
            type="file"
            className="announcements-file-input"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
          />

          <label className="announcements-switch" htmlFor="isPinned">
            <input
              id="isPinned"
              type="checkbox"
              name="isPinned"
              checked={form.isPinned}
              onChange={handleChange}
            />
            <span className="announcements-switch-track" aria-hidden="true"></span>
            <span className="announcements-switch-text">
              <strong>Pin to the top</strong>
              <small>Pinned announcements are highlighted for users.</small>
            </span>
          </label>

          <div className="announcements-form-actions">
            <button type="submit" className="announcements-submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingId
                ? "Update announcement"
                : "Publish announcement"}
            </button>

            {editingId && (
              <button
                type="button"
                className="announcements-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="announcements-list-section">
        <div className="announcements-list-heading">
          <h2>
            Published <span>{filtered.length}</span>
          </h2>

          <div className="announcements-search-wrap">
            <Icon name="search" size={19} />
            <input
              type="text"
              placeholder="Search title, source or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search announcements"
            />
          </div>
        </div>

        <div className="announcements-chips" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`announcements-chip${filterCategory === c ? " is-active" : ""}`}
              aria-pressed={filterCategory === c}
              onClick={() => setFilterCategory(c)}
            >
              {c === "All" ? "All categories" : c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="announcements-empty">
            <Icon name="megaphone" size={36} />
            <p>No announcements to show.</p>
          </div>
        ) : (
          <div className="announcements-grid">
            {filtered.map((item) => (
              <div
                key={item._id}
                className={`announcements-card${item.isPinned ? " is-pinned" : ""}`}
              >
                <div className="announcements-card-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="announcements-card-placeholder">
                      <Icon name="megaphone" size={44} />
                    </div>
                  )}
                </div>

                <div className="announcements-card-body">
                  <div className="announcements-card-top">
                    <span className={catClass(item.category)}>{item.category}</span>
                    {item.isPinned && (
                      <span className="announcements-pinned">
                        <Icon name="pin" size={13} /> Pinned
                      </span>
                    )}
                  </div>

                  <h3>{item.title}</h3>
                  <p className="announcements-card-source">
                    {item.source}
                    {item.location ? `, ${item.location}` : ""}
                  </p>
                  <p className="announcements-card-desc">{item.content}</p>
                  <p className="announcements-card-date">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>

                  <div className="announcements-card-actions">
                    <button
                      className="announcements-edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      <Icon name="edit" size={15} /> Edit
                    </button>
                    <button
                      className="announcements-delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      <Icon name="trash" size={15} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Announcements;