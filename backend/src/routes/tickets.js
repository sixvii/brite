const express = require("express");
const ticketController = require("../controllers/ticketController");
const { requireAuth } = require("../middleware/auth");
const { makeUploader } = require("../middleware/upload");

const router = express.Router();
const upload = makeUploader();

router.get("/me", requireAuth, ticketController.listMine);
router.get("/:id", requireAuth, ticketController.getById);
router.post("/", requireAuth, upload.fields([{ name: "receipt" }]), ticketController.create);

module.exports = router;
