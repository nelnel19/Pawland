const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// GET ALL USERS (Admin only)
router.get("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load users",
    });
  }
});

// GET SINGLE USER (Admin only)
router.get("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return res.status(500).json({
      message: "Failed to load user",
    });
  }
});

// UPDATE USER ROLE (Admin only)
router.put("/:id/role", protect, authorize("Admin"), async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["User", "Admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role value",
      });
    }

    // Prevent an admin from demoting themselves (avoid locking out)
    if (req.params.id === req.user.id && role !== "Admin") {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User role updated",
      user,
    });
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);
    return res.status(500).json({
      message: "Failed to update user role",
    });
  }
});

// UPDATE USER DETAILS (Admin only)
router.put("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        message: "Name must not exceed 100 characters",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const existing = await User.findOne({
      email,
      _id: { $ne: req.params.id },
    });

    if (existing) {
      return res.status(409).json({
        message: "Email is already in use",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated",
      user,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to update user",
    });
  }
});

// RESET USER PASSWORD (Admin only)
router.put("/:id/password", protect, authorize("Admin"), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
});

// DELETE USER (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    // Prevent an admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return res.status(500).json({
      message: "Failed to delete user",
    });
  }
});

module.exports = router;