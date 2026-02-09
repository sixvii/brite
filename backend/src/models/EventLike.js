const mongoose = require("mongoose");

const eventLikeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true }
  },
  { timestamps: true }
);

eventLikeSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("EventLike", eventLikeSchema);
