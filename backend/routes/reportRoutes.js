const express = require("express");
const multer = require("multer");

const Report = require("../models/Report");
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

// CREATE REPORT
router.post(
  "/",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        reportType,
        animalType,
        title,
        description,
        location,
        contactNumber,
      } = req.body;

      if (
        !reportType ||
        !animalType ||
        !title ||
        !description ||
        !location
      ) {
        return res.status(400).json({
          message: "Please fill in all required fields",
        });
      }

      if (!["Animal Abuse", "Animal Report"].includes(reportType)) {
        return res.status(400).json({
          message: "Invalid report type",
        });
      }

      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const trimmedAnimalType = animalType.trim();
      const trimmedLocation = location.trim();

      if (trimmedTitle.length > 120) {
        return res.status(400).json({
          message: "Title must not exceed 120 characters",
        });
      }

      if (trimmedDescription.length > 2000) {
        return res.status(400).json({
          message: "Description must not exceed 2000 characters",
        });
      }

      let imageUrl = "";

      // Upload image to Cloudinary if provided
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

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "pawland/reports",
              resource_type: "image",
            },
            (error, uploadedImage) => {
              if (error) {
                reject(error);
              } else {
                resolve(uploadedImage);
              }
            }
          );

          stream.end(req.file.buffer);
        });

        imageUrl = result.secure_url;
      }

      const report = await Report.create({
        user: req.user.id,
        reportType,
        animalType: trimmedAnimalType,
        title: trimmedTitle,
        description: trimmedDescription,
        location: trimmedLocation,
        contactNumber: contactNumber?.trim() || "",
        image: imageUrl,
      });

      return res.status(201).json({
        message: "Report submitted successfully",
        report,
      });
    } catch (error) {
      console.error("CREATE REPORT ERROR:", error);

      return res.status(500).json({
        message: error.message || "Failed to submit report",
      });
    }
  }
);

// GET MY REPORTS (user's own)
router.get("/my", protect, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("GET MY REPORTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to load reports",
    });
  }
});

// GET ALL REPORTS (Admin only)
router.get("/all", protect, authorize("Admin"), async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("GET ALL REPORTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to load reports",
    });
  }
});

// UPDATE REPORT STATUS (Admin only)
router.put(
  "/:id/status",
  protect,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Resolved",
        "Rejected",
      ];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status value",
        });
      }

      const report = await Report.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          message: "Report not found",
        });
      }

      report.status = status;
      await report.save();

      return res.status(200).json({
        message: "Report status updated successfully",
        report,
      });
    } catch (error) {
      console.error("UPDATE REPORT STATUS ERROR:", error);

      return res.status(500).json({
        message: "Failed to update report status",
      });
    }
  }
);

// GET SINGLE REPORT
router.get("/:id", protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      "user",
      "name email profilePicture"
    );

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    // Only the owner or Admin can view
    if (
      report.user._id.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("GET REPORT ERROR:", error);

    return res.status(500).json({
      message: "Failed to load report",
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