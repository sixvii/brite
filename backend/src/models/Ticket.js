const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    eventDate: {
      eventDate: String,
      startTime: String
    },
    eventDateId: {
      type: mongoose.Schema.Types.ObjectId
    },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, default: 0 },
    paymentMethodId: { type: mongoose.Schema.Types.ObjectId },
    receiptUrl: { type: String, trim: true },
    promoCode: { type: String, trim: true },
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
