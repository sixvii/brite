const Follow = require("../models/Follow");
const User = require("../models/User");
const { uploadToCloudinary } = require("../middleware/upload");

async function toggleFollow(req, res, next) {
  try {
    const followingId = req.params.id;
    const followerId = req.user.sub;

    if (followingId === followerId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ following: false });
    }

    await Follow.create({ followerId, followingId });
    return res.json({ following: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  toggleFollow,
  updateAvatar
};

async function updateAvatar(req, res, next) {
  try {
    const file = req.files?.avatar?.[0];
    if (!file) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const avatarUrl = await uploadToCloudinary(file, "brite/avatars");
    if (!avatarUrl) {
      return res.status(500).json({ message: "Failed to upload avatar" });
    }

    user.avatarUrl = avatarUrl;
    await user.save();

    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      isRestricted: user.isRestricted
    });
  } catch (error) {
    return next(error);
  }
}
