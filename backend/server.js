require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const petRoutes = require("./routes/petRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userRoutes = require("./routes/userRoutes");
const protect = require("./middleware/authMiddleware");
const User = require("./models/User");

const app = express();

// Allow both local development and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://pawland-main.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Connect to MongoDB Atlas
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/users", userRoutes);

// Protected dashboard
app.get("/api/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Welcome to your dashboard",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});