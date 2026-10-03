const express = require("express");
const multer = require("multer");

const Pet = require("../models/Pet");
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

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pawland/pets",
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

// GET ALL AVAILABLE PETS (public to logged-in users)
router.get("/", protect, async (req, res) => {
  try {
    const { species, gender, size, search } = req.query;

    const filter = {};

    if (species && species !== "All") filter.species = species;
    if (gender && gender !== "All") filter.gender = gender;
    if (size && size !== "All") filter.size = size;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { breed: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const pets = await Pet.find(filter)
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ pets });
  } catch (error) {
    console.error("GET PETS ERROR:", error);
    return res.status(500).json({
      message: "Failed to load pets",
    });
  }
});

// GET SINGLE PET
router.get("/:id", protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "addedBy",
      "name email"
    );

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    return res.status(200).json({ pet });
  } catch (error) {
    console.error("GET PET ERROR:", error);
    return res.status(500).json({
      message: "Failed to load pet",
    });
  }
});

// CREATE PET (Admin only)
router.post(
  "/",
  protect,
  authorize("Admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        species,
        breed,
        age,
        gender,
        size,
        description,
        location,
        status,
      } = req.body;

      if (
        !name ||
        !species ||
        !age ||
        !gender ||
        !description ||
        !location
      ) {
        return res.status(400).json({
          message: "Please fill in all required fields",
        });
      }

      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const trimmedLocation = location.trim();

      if (trimmedName.length > 80) {
        return res.status(400).json({
          message: "Name must not exceed 80 characters",
        });
      }

      if (trimmedDescription.length > 2000) {
        return res.status(400).json({
          message: "Description must not exceed 2000 characters",
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

      const pet = await Pet.create({
        name: trimmedName,
        species,
        breed: breed?.trim() || "",
        age: age.trim(),
        gender,
        size: size || "Medium",
        description: trimmedDescription,
        location: trimmedLocation,
        image: imageUrl,
        status: status || "Available",
        addedBy: req.user.id,
      });

      return res.status(201).json({
        message: "Pet added successfully",
        pet,
      });
    } catch (error) {
      console.error("CREATE PET ERROR:", error);
      return res.status(500).json({
        message: error.message || "Failed to add pet",
      });
    }
  }
);

// UPDATE PET (Admin only)
router.put(
  "/:id",
  protect,
  authorize("Admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      const {
        name,
        species,
        breed,
        age,
        gender,
        size,
        description,
        location,
        status,
      } = req.body;

      if (name) pet.name = name.trim();
      if (species) pet.species = species;
      if (breed !== undefined) pet.breed = breed.trim();
      if (age) pet.age = age.trim();
      if (gender) pet.gender = gender;
      if (size) pet.size = size;
      if (description) pet.description = description.trim();
      if (location) pet.location = location.trim();
      if (status) pet.status = status;

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
        pet.image = result.secure_url;
      }

      await pet.save();

      return res.status(200).json({
        message: "Pet updated successfully",
        pet,
      });
    } catch (error) {
      console.error("UPDATE PET ERROR:", error);
      return res.status(500).json({
        message: error.message || "Failed to update pet",
      });
    }
  }
);

// DELETE PET (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    return res.status(200).json({
      message: "Pet deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PET ERROR:", error);
    return res.status(500).json({
      message: "Failed to delete pet",
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