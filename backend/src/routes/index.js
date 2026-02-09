const express = require("express");

const authRoutes = require("./auth");
const eventRoutes = require("./events");
const ticketRoutes = require("./tickets");
const helpRoutes = require("./help");
const userRoutes = require("./users");
const dashboardRoutes = require("./dashboard");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/tickets", ticketRoutes);
router.use("/help", helpRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
