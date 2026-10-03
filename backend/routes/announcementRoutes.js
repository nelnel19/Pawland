const express = require("express");
const multer = require("multer");

const Announcement = require("../models/Announcement");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Configure image upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
    }
  },
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pawland/announcements",
        resource_type: "image",
      },
      (error, uploadedImage) => {
        if (error) reject(error);
        else resolve(uploadedImage);
      }
    );
    stream.end(buffer);
  });
};

// GET ALL ANNOUNCEMENTS (any logged-in user)
router.get("/", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("postedBy", "name email profilePicture")
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({ announcements });
  } catch (error) {
    console.error("GET ANNOUNCEMENTS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load announcements",
    });
  }
});

// GET SINGLE ANNOUNCEMENT
router.get("/:id", protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "postedBy",
      "name email profilePicture"
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.status(200).json({ announcement });
  } catch (error) {
    console.error("GET ANNOUNCEMENT ERROR:", error);
    return res.status(500).json({
      message: "Failed to load announcement",
    });
  }
});

// CREATE ANNOUNCEMENT (Admin only)
router.post(
  "/",
  protect,
  authorize("Admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, category, source, content, location, isPinned } = req.body;

      if (!title || !source || !content) {
        return res.status(400).json({
          message: "Please fill in all required fields",
        });
      }

      const trimmedTitle = title.trim();
      const trimmedSource = source.trim();
      const trimmedContent = content.trim();

      if (trimmedTitle.length > 150) {
        return res.status(400).json({
          message: "Title must not exceed 150 characters",
        });
      }

      if (trimmedContent.length > 3000) {
        return res.status(400).json({
          message: "Content must not exceed 3000 characters",
        });
      }

      let imageUrl = "";

      if (req.file) {
        if (
          !process.env.CLOUDINARY_CLOUD_NAME ||
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          return res.status(500).json({
            message: "Cloudinary is not configured on the server",
          });
        }

        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      }

      const announcement = await Announcement.create({
        title: trimmedTitle,
        category: category || "LGU",
        source: trimmedSource,
        content: trimmedContent,
        location: location?.trim() || "",
        image: imageUrl,
        isPinned: isPinned === "true" || isPinned === true,
        postedBy: req.user.id,
      });

      return res.status(201).json({
        message: "Announcement published successfully",
        announcement,
      });
    } catch (error) {
      console.error("CREATE ANNOUNCEMENT ERROR:", error);
      return res.status(500).json({
        message: error.message || "Failed to publish announcement",
      });
    }
  }
);

// UPDATE ANNOUNCEMENT (Admin only)
router.put(
  "/:id",
  protect,
  authorize("Admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const announcement = await Announcement.findById(req.params.id);

      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const { title, category, source, content, location, isPinned } = req.body;

      if (title !== undefined) announcement.title = title.trim();
      if (category !== undefined) announcement.category = category;
      if (source !== undefined) announcement.source = source.trim();
      if (content !== undefined) announcement.content = content.trim();
      if (location !== undefined) announcement.location = location.trim();
      if (isPinned !== undefined) {
        announcement.isPinned = isPinned === "true" || isPinned === true;
      }

      if (req.file) {
        if (
          !process.env.CLOUDINARY_CLOUD_NAME ||
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          return res.status(500).json({
            message: "Cloudinary is not configured on the server",
          });
        }

        const result = await uploadToCloudinary(req.file.buffer);
        announcement.image = result.secure_url;
      }

      await announcement.save();

      return res.status(200).json({
        message: "Announcement updated successfully",
        announcement,
      });
    } catch (error) {
      console.error("UPDATE ANNOUNCEMENT ERROR:", error);
      return res.status(500).json({
        message: error.message || "Failed to update announcement",
      });
    }
  }
);

// DELETE ANNOUNCEMENT (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ANNOUNCEMENT ERROR:", error);
    return res.status(500).json({
      message: "Failed to delete announcement",
    });
  }
});

// Handle image upload errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5 MB or smaller"
          : error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Image upload failed",
    });
  }

  next();
});

module.exports = router;