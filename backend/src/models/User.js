const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    accountType: {
      type: String,
      default: "personal"
    },
    phone: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      trim: true
    },
    roles: {
      type: [String],
      default: []
    },
    isRestricted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
