import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Adoption.css";

const ICONS = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  close: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

const SPECIES = ["All", "Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function Adoption() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);

  const [filterSpecies, setFilterSpecies] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterSize, setFilterSize] = useState("All");
  const [search, setSearch] = useState("");

  // Application form state
  const [showApply, setShowApply] = useState(false);
  const [appForm, setAppForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    reason: "",
    hasPets: "No",
    homeType: "House",
  });
  const [submitting, setSubmitting] = useState(false);

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

        // Prefill application with user data
        setAppForm((prev) => ({
          ...prev,
          fullName: userRes.data.user.name || "",
          email: userRes.data.user.email || "",
        }));

        const petsRes = await API.get("/pets");
        setPets(petsRes.data.pets);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setError(err.response?.data?.message || "Failed to load pets.");
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

  const handleAppChange = (e) => {
    setAppForm({ ...appForm, [e.target.name]: e.target.value });
  };

  const openApplication = (pet) => {
    setSelectedPet(pet);
    setShowApply(true);
    setError("");
    setSuccess("");
  };

  const closeApplication = () => {
    setShowApply(false);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await API.post("/applications", {
        petId: selectedPet._id,
        ...appForm,
      });

      setSuccess(
        "Your application has been submitted! An admin will review it shortly."
      );
      setShowApply(false);
      setSelectedPet(null);

      // Reset form except name and email (keep prefilled)
      setAppForm((prev) => ({
        ...prev,
        phone: "",
        address: "",
        reason: "",
        hasPets: "No",
        homeType: "House",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterSpecies("All");
    setFilterGender("All");
    setFilterSize("All");
    setSearch("");
  };

  const filteredPets = pets.filter((p) => {
    const matchSpecies = filterSpecies === "All" || p.species === filterSpecies;
    const matchGender = filterGender === "All" || p.gender === filterGender;
    const matchSize = filterSize === "All" || p.size === filterSize;

    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.breed?.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);

    return matchSpecies && matchGender && matchSize && matchSearch;
  });

  const availableCount = pets.filter((p) => p.status === "Available").length;
  const hasFilters =
    filterSpecies !== "All" || filterGender !== "All" || filterSize !== "All" || search.trim();

  if (loading) {
    return (
      <div className="adoption-loading">
        <div className="adoption-spinner"></div>
        <p>Loading pets...</p>
      </div>
    );
  }

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Adopt", to: "/adoption" },
    { label: "My applications", to: "/my-applications" },
    { label: "Report", to: "/report" },
  ];

  return (
    <div className="adoption-page">
      <header className="adoption-header">
        <div className="adoption-brand">
          <div className="adoption-logo"><PawMark size={22} /></div>
          <span>PawLand</span>
        </div>

        <nav className="adoption-nav" aria-label="Main">
          {navLinks.map((link) => (
            <button
              key={link.to}
              className={`adoption-nav-btn${link.to === "/adoption" ? " is-active" : ""}`}
              onClick={() => navigate(link.to)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="adoption-header-actions">
          <button className="adoption-profile-btn" onClick={() => navigate("/profile")}>
            <span className="adoption-header-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </span>
            <span className="adoption-profile-label">{user?.name || "Profile"}</span>
          </button>
          <button className="adoption-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="adoption-main">
        <section className="adoption-hero">
          <div className="adoption-hero-copy">
            <h1>Find your new best friend.</h1>
            <p>
              Every animal here has been rescued, cared for and is waiting for someone like you. Browse, apply and give one a forever home.
            </p>
          </div>

          <div className="adoption-hero-stats">
            <div>
              <strong>{availableCount}</strong>
              <span>Ready to adopt</span>
            </div>
            <div>
              <strong>{pets.length}</strong>
              <span>Animals listed</span>
            </div>
          </div>
        </section>

        {error && !showApply && <p className="adoption-error" role="alert">{error}</p>}
        {success && <p className="adoption-success" role="status">{success}</p>}

        <section className="adoption-filters">
          <div className="adoption-search-wrap">
            <Icon name="search" size={19} />
            <input
              type="text"
              placeholder="Search by name, breed or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adoption-search"
              aria-label="Search pets"
            />
          </div>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            aria-label="Filter by gender"
          >
            <option value="All">Any gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            aria-label="Filter by size"
          >
            <option value="All">Any size</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>

          <div className="adoption-chips" role="group" aria-label="Filter by species">
            {SPECIES.map((s) => (
              <button
                key={s}
                type="button"
                className={`adoption-chip${filterSpecies === s ? " is-active" : ""}`}
                onClick={() => setFilterSpecies(s)}
                aria-pressed={filterSpecies === s}
              >
                {s === "All" ? "All species" : s}
              </button>
            ))}
          </div>
        </section>

        <div className="adoption-results-bar">
          <p>
            Showing <strong>{filteredPets.length}</strong> of {pets.length} pets
          </p>
          {hasFilters && (
            <button className="adoption-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <section className="adoption-grid-section">
          {filteredPets.length === 0 ? (
            <div className="adoption-empty">
              <PawMark size={42} />
              <h3>No pets match your search</h3>
              <p>Try a different species or clear your filters to see everyone.</p>
              {hasFilters && (
                <button className="adoption-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="adoption-grid">
              {filteredPets.map((pet) => (
                <article key={pet._id} className="adoption-card">
                  <div className="adoption-card-image">
                    {pet.image ? (
                      <img src={pet.image} alt={pet.name} />
                    ) : (
                      <div className="adoption-placeholder">
                        <PawMark size={56} />
                      </div>
                    )}

                    <span
                      className={`adoption-status adoption-status-${pet.status.toLowerCase()}`}
                    >
                      {pet.status}
                    </span>
                  </div>

                  <div className="adoption-card-body">
                    <div className="adoption-card-head">
                      <h3>{pet.name}</h3>
                      <span className="adoption-gender">{pet.gender}</span>
                    </div>

                    <p className="adoption-card-breed">
                      {pet.breed ? `${pet.species}, ${pet.breed}` : pet.species}
                    </p>

                    <div className="adoption-tags">
                      <span>{pet.age}</span>
                      <span>{pet.size}</span>
                    </div>

                    <p className="adoption-card-location">
                      <Icon name="pin" size={16} /> {pet.location}
                    </p>

                    <p className="adoption-card-desc">{pet.description}</p>

                    <button
                      className="adoption-view-btn"
                      onClick={() => setSelectedPet(pet)}
                    >
                      View details <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Pet details modal */}
      {selectedPet && !showApply && (
        <div
          className="adoption-modal-backdrop"
          onClick={() => setSelectedPet(null)}
        >
          <div
            className="adoption-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selectedPet.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="adoption-modal-close"
              onClick={() => setSelectedPet(null)}
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>

            {selectedPet.image ? (
              <img
                src={selectedPet.image}
                alt={selectedPet.name}
                className="adoption-modal-image"
              />
            ) : (
              <div className="adoption-modal-placeholder">
                <PawMark size={64} />
              </div>
            )}

            <div className="adoption-modal-body">
              <div className="adoption-modal-top">
                <span className="adoption-species">{selectedPet.species}</span>
                <span
                  className={`adoption-status-inline adoption-status-${selectedPet.status.toLowerCase()}`}
                >
                  {selectedPet.status}
                </span>
              </div>

              <h2>{selectedPet.name}</h2>

              <div className="adoption-modal-grid">
                <div>
                  <span className="adoption-modal-label">Breed</span>
                  <p>{selectedPet.breed || "Not specified"}</p>
                </div>
                <div>
                  <span className="adoption-modal-label">Age</span>
                  <p>{selectedPet.age}</p>
                </div>
                <div>
                  <span className="adoption-modal-label">Gender</span>
                  <p>{selectedPet.gender}</p>
                </div>
                <div>
                  <span className="adoption-modal-label">Size</span>
                  <p>{selectedPet.size}</p>
                </div>
                <div>
                  <span className="adoption-modal-label">Location</span>
                  <p>{selectedPet.location}</p>
                </div>
                <div>
                  <span className="adoption-modal-label">Listed</span>
                  <p>{new Date(selectedPet.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="adoption-modal-desc">
                <span className="adoption-modal-label">About {selectedPet.name}</span>
                <p>{selectedPet.description}</p>
              </div>

              {selectedPet.status === "Available" ? (
                <button
                  className="adoption-adopt-btn"
                  onClick={() => openApplication(selectedPet)}
                >
                  Apply to adopt {selectedPet.name}
                </button>
              ) : (
                <p className="adoption-not-available">
                  This pet is currently not available for adoption.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application form modal */}
      {selectedPet && showApply && (
        <div className="adoption-modal-backdrop">
          <div
            className="adoption-modal adoption-application-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adoption application"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="adoption-modal-close"
              onClick={closeApplication}
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="adoption-modal-body">
              <h2>Adoption application</h2>
              <p className="adoption-modal-subtitle">
                Applying to adopt <strong>{selectedPet.name}</strong> (
                {selectedPet.species})
              </p>

              {error && <p className="adoption-error" role="alert">{error}</p>}

              <form
                className="adoption-application-form"
                onSubmit={submitApplication}
              >
                <label htmlFor="fullName">Full name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={appForm.fullName}
                  onChange={handleAppChange}
                  required
                />

                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={appForm.email}
                  onChange={handleAppChange}
                  required
                />

                <label htmlFor="phone">Phone number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="e.g. 0917 123 4567"
                  value={appForm.phone}
                  onChange={handleAppChange}
                  required
                />

                <label htmlFor="address">Home address *</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="City, Province"
                  value={appForm.address}
                  onChange={handleAppChange}
                  required
                />

                <div className="adoption-form-row">
                  <div>
                    <label htmlFor="homeType">Home type</label>
                    <select
                      id="homeType"
                      name="homeType"
                      value={appForm.homeType}
                      onChange={handleAppChange}
                    >
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Condo">Condo</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="hasPets">Do you have pets?</label>
                    <select
                      id="hasPets"
                      name="hasPets"
                      value={appForm.hasPets}
                      onChange={handleAppChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                <label htmlFor="reason">
                  Why do you want to adopt this pet? *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  placeholder="Tell us a bit about yourself and why you'd be a great fit."
                  value={appForm.reason}
                  onChange={handleAppChange}
                  maxLength={1000}
                  required
                />

                <div className="adoption-application-actions">
                  <button
                    type="button"
                    className="adoption-cancel-btn"
                    onClick={closeApplication}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="adoption-adopt-btn"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="adoption-footer">
        <p>© {new Date().getFullYear()} PawLand. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Adoption;