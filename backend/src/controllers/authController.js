const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpiresIn }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, name, accountType, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      accountType: accountType || "personal",
      phone
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        isRestricted: user.isRestricted
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        isRestricted: user.isRestricted
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).select(
      "email name accountType phone avatarUrl roles isRestricted"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

module.exports = {
  register,
  login,
  me
};
