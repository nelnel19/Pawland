import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Available.css";

const emptyForm = {
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  gender: "Male",
  size: "Medium",
  description: "",
  location: "",
  status: "Available",
};

const SPECIES = ["All", "Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
};

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

function Available() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState("All");
  const [search, setSearch] = useState("");

  const fetchPets = async () => {
    try {
      const res = await API.get("/pets");
      setPets(res.data.pets);
    } catch (err) {
      console.error("FETCH PETS ERROR:", err);
      setError(err.response?.data?.message || "Failed to load pets.");
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

        await fetchPets();
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
        await API.put(`/pets/${editingId}`, formData);
        setSuccess("Pet updated successfully!");
      } else {
        await API.post("/pets", formData);
        setSuccess("Pet added successfully!");
      }

      resetForm();
      fetchPets();
    } catch (err) {
      console.error("SAVE PET ERROR:", err);
      setError(err.response?.data?.message || "Failed to save pet.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pet) => {
    setEditingId(pet._id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: pet.age,
      gender: pet.gender,
      size: pet.size || "Medium",
      description: pet.description,
      location: pet.location,
      status: pet.status,
    });
    setImage(null);
    setImagePreview(pet.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pet listing?")) return;

    try {
      await API.delete(`/pets/${id}`);
      setPets((prev) => prev.filter((p) => p._id !== id));
      setSuccess("Pet deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete pet.");
    }
  };

  const filteredPets = pets.filter((p) => {
    const matchSpecies =
      filterSpecies === "All" || p.species === filterSpecies;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.breed?.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    return matchSpecies && matchSearch;
  });

  if (loading) {
    return (
      <div className="available-loading">
        <div className="available-spinner"></div>
        <p>Loading pets...</p>
      </div>
    );
  }

  const countStatus = (s) => pets.filter((p) => p.status === s).length;
  const stats = [
    { label: "Total listed", value: pets.length },
    { label: "Available", value: countStatus("Available") },
    { label: "Pending", value: countStatus("Pending") },
    { label: "Adopted", value: countStatus("Adopted") },
  ];

  return (
    <div className="available-content">
      <section className="available-hero">
        <div className="available-hero-copy">
          <h1>Animal record management.</h1>
          <p>Add, edit or remove the pets shown on the public Adoption page.</p>
        </div>

        <div className="available-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="available-error" role="alert">{error}</p>}
      {success && <p className="available-success" role="status">{success}</p>}

      <section className="available-form-section">
        <div className="available-form-head">
          <div>
            <h2>{editingId ? "Edit pet" : "Add a new pet"}</h2>
            <p>
              {editingId
                ? "Update the details below and save your changes."
                : "Fields marked with * are required."}
            </p>
          </div>
          {editingId && <span className="available-editing-badge">Editing</span>}
        </div>

        <form className="available-form" onSubmit={handleSubmit}>
          <div className="available-form-grid">
            <div>
              <label htmlFor="name">Pet name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Buddy"
                value={form.name}
                onChange={handleChange}
                maxLength={80}
                required
              />
            </div>

            <div>
              <label htmlFor="species">Species *</label>
              <select
                id="species"
                name="species"
                value={form.species}
                onChange={handleChange}
                required
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Fish">Fish</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="breed">Breed</label>
              <input
                id="breed"
                name="breed"
                type="text"
                placeholder="e.g. Labrador"
                value={form.breed}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="age">Age *</label>
              <input
                id="age"
                name="age"
                type="text"
                placeholder="e.g. 2 years"
                value={form.age}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label htmlFor="size">Size</label>
              <select
                id="size"
                name="size"
                value={form.size}
                onChange={handleChange}
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>

            <div>
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="City or shelter name"
                value={form.location}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Available">Available</option>
                <option value="Pending">Pending</option>
                <option value="Adopted">Adopted</option>
              </select>
            </div>
          </div>

          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe the pet's temperament, health and story."
            value={form.description}
            onChange={handleChange}
            maxLength={2000}
            required
          />
          <span className="available-counter">{form.description.length} / 2000</span>

          <span className="available-label">Pet photo</span>
          {imagePreview ? (
            <div className="available-image-preview">
              <img src={imagePreview} alt="Preview" />
              <label htmlFor="image" className="available-replace">
                <Icon name="upload" size={16} /> Replace photo
              </label>
            </div>
          ) : (
            <label htmlFor="image" className="available-dropzone">
              <Icon name="upload" size={26} />
              <strong>Choose a photo</strong>
              <span>JPG, PNG, WEBP or GIF</span>
            </label>
          )}
          <input
            id="image"
            name="image"
            type="file"
            className="available-file-input"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
          />

          <div className="available-form-actions">
            <button type="submit" className="available-submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingId
                ? "Update pet"
                : "Add pet"}
            </button>

            {editingId && (
              <button
                type="button"
                className="available-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="available-list-section">
        <div className="available-list-heading">
          <h2>
            Current listings <span>{filteredPets.length}</span>
          </h2>

          <div className="available-search-wrap">
            <Icon name="search" size={19} />
            <input
              type="text"
              placeholder="Search by name, breed or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search pets"
            />
          </div>
        </div>

        <div className="available-chips" role="group" aria-label="Filter by species">
          {SPECIES.map((s) => (
            <button
              key={s}
              type="button"
              className={`available-chip${filterSpecies === s ? " is-active" : ""}`}
              aria-pressed={filterSpecies === s}
              onClick={() => setFilterSpecies(s)}
            >
              {s === "All" ? "All species" : s}
            </button>
          ))}
        </div>

        {filteredPets.length === 0 ? (
          <div className="available-empty">
            <PawMark size={40} />
            <p>No pets to show.</p>
          </div>
        ) : (
          <div className="available-grid">
            {filteredPets.map((pet) => (
              <div key={pet._id} className="available-card">
                <div className="available-card-image">
                  {pet.image ? (
                    <img src={pet.image} alt={pet.name} />
                  ) : (
                    <div className="available-card-placeholder">
                      <PawMark size={52} />
                    </div>
                  )}
                  <span
                    className={`available-status available-status-${pet.status.toLowerCase()}`}
                  >
                    {pet.status}
                  </span>
                </div>

                <div className="available-card-body">
                  <div className="available-card-head">
                    <h3>{pet.name}</h3>
                    <span className="available-species">{pet.species}</span>
                  </div>

                  <p className="available-card-meta">
                    {pet.breed ? `${pet.breed}, ` : ""}
                    {pet.age}, {pet.gender}
                  </p>
                  <p className="available-card-location">
                    <Icon name="pin" size={15} /> {pet.location}
                  </p>
                  <p className="available-card-desc">{pet.description}</p>

                  <div className="available-card-actions">
                    <button
                      className="available-edit-btn"
                      onClick={() => handleEdit(pet)}
                    >
                      <Icon name="edit" size={15} /> Edit
                    </button>
                    <button
                      className="available-delete-btn"
                      onClick={() => handleDelete(pet._id)}
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

export default Available;