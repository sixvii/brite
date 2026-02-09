const express = require("express");
const eventController = require("../controllers/eventController");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { makeUploader } = require("../middleware/upload");

const router = express.Router();
const upload = makeUploader();

router.get("/", eventController.list);
router.get("/:id/engagement", optionalAuth, eventController.engagement);
router.get("/:id", eventController.getById);
router.post("/", requireAuth, upload.fields([{ name: "images" }]), eventController.create);
router.put("/:id", requireAuth, upload.fields([{ name: "images" }]), eventController.update);
router.post("/:id/like", requireAuth, eventController.toggleLike);
router.delete("/:id", requireAuth, eventController.remove);

module.exports = router;
