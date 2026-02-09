const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: "Nigeria"
    },
    location: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    venueName: {
      type: String,
      trim: true
    },
    venueAddress: {
      type: String,
      trim: true
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isFree: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    status: {
      type: String,
      default: "active"
    },
    eventHours: {
      type: String,
      trim: true
    },
    refundPolicy: {
      type: String,
      trim: true
    },
    isPromoted: {
      type: Boolean,
      default: false
    },
    capacity: {
      type: Number,
      default: 0
    },
    images: [
      {
        url: String,
        displayOrder: Number
      }
    ],
    dates: [
      {
        eventDate: String,
        startTime: String,
        endTime: String,
        isSoldOut: { type: Boolean, default: false }
      }
    ],
    promoters: [
      {
        name: String
      }
    ],
    paymentMethods: [
      {
        bankName: String,
        accountName: String,
        accountNumber: String
      }
    ],
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
