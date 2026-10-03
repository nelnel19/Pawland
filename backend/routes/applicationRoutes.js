const express = require("express");

const Application = require("../models/Application");
const Pet = require("../models/Pet");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// CREATE APPLICATION (any logged-in user)
router.post("/", protect, async (req, res) => {
  try {
    const {
      petId,
      fullName,
      email,
      phone,
      address,
      reason,
      hasPets,
      homeType,
    } = req.body;

    if (
      !petId ||
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !reason
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields",
      });
    }

    const pet = await Pet.findById(petId);

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found",
      });
    }

    if (pet.status !== "Available") {
      return res.status(400).json({
        message: "This pet is no longer available for adoption",
      });
    }

    // Prevent duplicate pending applications from the same user
    const existing = await Application.findOne({
      user: req.user.id,
      pet: petId,
      status: "Pending",
    });

    if (existing) {
      return res.status(409).json({
        message: "You already have a pending application for this pet",
      });
    }

    const application = await Application.create({
      user: req.user.id,
      pet: petId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      reason: reason.trim(),
      hasPets: hasPets || "No",
      homeType: homeType || "House",
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("CREATE APPLICATION ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit application",
    });
  }
});

// GET MY APPLICATIONS (user's own)
router.get("/my", protect, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate("pet", "name species breed image status location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("GET MY APPLICATIONS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load applications",
    });
  }
});

// GET ALL APPLICATIONS (Admin only)
router.get("/all", protect, authorize("Admin"), async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("user", "name email profilePicture")
      .populate("pet", "name species breed image status location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("GET ALL APPLICATIONS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load applications",
    });
  }
});

// GET SINGLE APPLICATION (owner or Admin)
router.get("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("user", "name email profilePicture")
      .populate("pet", "name species breed image status location");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (
      application.user._id.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ application });
  } catch (error) {
    console.error("GET APPLICATION ERROR:", error);
    return res.status(500).json({
      message: "Failed to load application",
    });
  }
});

// UPDATE APPLICATION STATUS (Admin only)
router.put(
  "/:id/status",
  protect,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { status, adminNote } = req.body;

      const allowed = ["Pending", "Approved", "Rejected"];

      if (!status || !allowed.includes(status)) {
        return res.status(400).json({
          message: "Invalid status value",
        });
      }

      const application = await Application.findById(req.params.id)
        .populate("user", "name email profilePicture")
        .populate("pet", "name species breed image status location");

      if (!application) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      application.status = status;

      if (typeof adminNote === "string") {
        application.adminNote = adminNote.trim();
      }

      await application.save();

      // If approved, mark the pet as Adopted
      if (status === "Approved") {
        await Pet.findByIdAndUpdate(application.pet._id, {
          status: "Adopted",
        });
      }

      // If moved back to Pending (undo approval), set pet back to Available
      if (
        status === "Pending" &&
        application.pet &&
        application.pet.status === "Adopted"
      ) {
        await Pet.findByIdAndUpdate(application.pet._id, {
          status: "Available",
        });
      }

      return res.status(200).json({
        message: "Application status updated successfully",
        application,
      });
    } catch (error) {
      console.error("UPDATE APPLICATION STATUS ERROR:", error);
      return res.status(500).json({
        message: "Failed to update application status",
      });
    }
  }
);

// DELETE APPLICATION (owner can cancel a pending one)
router.delete("/:id", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const isOwner = application.user.toString() === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only pending applications can be cancelled by the owner
    if (isOwner && !isAdmin && application.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending applications can be cancelled",
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("DELETE APPLICATION ERROR:", error);
    return res.status(500).json({
      message: "Failed to delete application",
    });
  }
});

module.exports = router;