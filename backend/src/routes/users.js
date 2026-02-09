const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const { makeUploader } = require("../middleware/upload");

const router = express.Router();
const upload = makeUploader();

router.post("/:id/follow", requireAuth, userController.toggleFollow);
router.post("/me/avatar", requireAuth, upload.fields([{ name: "avatar" }]), userController.updateAvatar);

module.exports = router;
