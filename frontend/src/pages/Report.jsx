import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Report.css";

const ICONS = {
  alert: "M12 3l10 18H2L12 3zM12 10v5M12 18h.01",
  clipboard: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  close: "M6 6l12 12M18 6L6 18",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
};

function Icon({ name, size = 20 }) {
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

function Report() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reportType: "Animal Abuse",
    animalType: "",
    title: "",
    description: "",
    location: "",
    contactNumber: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [myReports, setMyReports] = useState([]);

  const fetchMyReports = async () => {
    try {
      const response = await API.get("/reports/my");
      setMyReports(response.data.reports);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("reportType", form.reportType);
      formData.append("animalType", form.animalType);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("location", form.location);
      formData.append("contactNumber", form.contactNumber);

      if (image) {
        formData.append("image", image);
      }

      await API.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Report submitted successfully!");

      setForm({
        reportType: "Animal Abuse",
        animalType: "",
        title: "",
        description: "",
        location: "",
        contactNumber: "",
      });
      setImage(null);
      setImagePreview("");

      fetchMyReports();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit report."
      );
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "Report", to: "/report" },
    { label: "Announcements", to: "/announcement" },
  ];

  const types = [
    { value: "Animal Abuse", icon: "alert", text: "Cruelty, neglect or harm to an animal" },
    { value: "Animal Report", icon: "clipboard", text: "A lost, found or stray animal" },
  ];

  return (
    <div className="report-page">
      <header className="report-header-bar">
        <div className="report-brand">
          <div className="report-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="report-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              className={`report-nav-btn${link.to === "/report" ? " is-active" : ""}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button className="report-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="report-container">
        <section className="report-hero">
          <h1>Report an animal in need.</h1>
          <p>
            Tell us what you saw. The more detail you share, the faster our rescue team can respond.
          </p>
        </section>

        <div className="report-layout">
          <div className="report-form-card">
            <h2>Report details</h2>

            {error && <p className="report-error" role="alert">{error}</p>}
            {success && <p className="report-success" role="status">{success}</p>}

            <form className="report-form" onSubmit={handleSubmit}>
              <span className="report-label">What are you reporting?</span>
              <div className="report-types" role="group" aria-label="Report type">
                {types.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`report-type${form.reportType === t.value ? " is-active" : ""}`}
                    aria-pressed={form.reportType === t.value}
                    onClick={() => setForm({ ...form, reportType: t.value })}
                  >
                    <span className="report-type-icon"><Icon name={t.icon} /></span>
                    <strong>{t.value}</strong>
                    <span>{t.text}</span>
                  </button>
                ))}
              </div>

              <div className="report-row">
                <div>
                  <label htmlFor="animalType">Animal type</label>
                  <input
                    id="animalType"
                    name="animalType"
                    type="text"
                    placeholder="e.g. Dog, Cat, Bird"
                    value={form.animalType}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Street, barangay or landmark"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Short summary of the report"
                value={form.title}
                onChange={handleChange}
                maxLength={120}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe what happened, when, and the animal's condition."
                value={form.description}
                onChange={handleChange}
                rows={6}
                maxLength={2000}
                required
              />
              <span className="report-counter">{form.description.length} / 2000</span>

              <label htmlFor="contactNumber">Contact number (optional)</label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="text"
                placeholder="So our team can reach you"
                value={form.contactNumber}
                onChange={handleChange}
              />

              <span className="report-label">Photo (optional)</span>
              {imagePreview ? (
                <div className="report-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={removeImage} aria-label="Remove photo">
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : (
                <label htmlFor="image" className="report-dropzone">
                  <Icon name="upload" size={26} />
                  <strong>Choose a photo</strong>
                  <span>JPG, PNG, WEBP or GIF</span>
                </label>
              )}
              <input
                id="image"
                name="image"
                type="file"
                className="report-file-input"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
              />

              <button type="submit" className="report-submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit report"}
              </button>
            </form>
          </div>

          <aside className="report-list">
            <h2>My reports</h2>

            {myReports.length === 0 ? (
              <div className="report-empty">
                <PawMark size={38} />
                <p>You haven't submitted any reports yet.</p>
              </div>
            ) : (
              <ul>
                {myReports.map((r) => (
                  <li key={r._id} className="report-item">
                    {r.image && (
                      <img src={r.image} alt={r.title} className="report-item-image" />
                    )}

                    <div className="report-item-content">
                      <div className="report-item-top">
                        <span className="report-badge">{r.reportType}</span>
                        <span
                          className={`report-status report-status-${r.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <h3>{r.title}</h3>
                      <p className="report-item-meta">
                        <strong>Animal:</strong> {r.animalType}
                      </p>
                      <p className="report-item-meta">
                        <Icon name="pin" size={14} /> {r.location}
                      </p>
                      <p className="report-item-desc">{r.description}</p>
                      <p className="report-item-date">
                        Submitted {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Report;