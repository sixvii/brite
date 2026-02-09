const express = require("express");
const helpController = require("../controllers/helpController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuth, helpController.create);

module.exports = router;
