const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    hasPets: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    homeType: {
      type: String,
      enum: ["House", "Apartment", "Condo", "Other"],
      default: "House",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from submitting more than one Pending application for the same pet
applicationSchema.index(
  { user: 1, pet: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Pending" },
  }
);

module.exports = mongoose.model("Application", applicationSchema);