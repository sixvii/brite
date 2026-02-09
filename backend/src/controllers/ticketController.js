const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const { uploadToCloudinary } = require("../middleware/upload");

async function create(req, res, next) {
  try {
    const {
      eventId,
      eventDateId,
      quantity,
      totalAmount,
      paymentMethodId,
      promoCode,
      status
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "Event is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let eventDate = null;
    if (eventDateId) {
      const match = event.dates.find((date) => date._id.toString() === eventDateId);
      if (match) {
        eventDate = { eventDate: match.eventDate, startTime: match.startTime };
      }
    }

    const receiptFile = req.files?.receipt?.[0];
    const receiptUrl = receiptFile ? await uploadToCloudinary(receiptFile, "brite/receipts") : null;

    const ticket = await Ticket.create({
      userId: req.user.sub,
      eventId,
      eventDate,
      eventDateId: eventDateId || null,
      quantity: Number(quantity) || 1,
      totalAmount: Number(totalAmount) || 0,
      paymentMethodId: paymentMethodId || null,
      receiptUrl,
      promoCode: promoCode || null,
      status: status || "pending"
    });

    return res.status(201).json(ticket);
  } catch (error) {
    return next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const tickets = await Ticket.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .populate("eventId");

    const response = tickets.map((ticket) => {
      const event = ticket.eventId;
      return {
        id: ticket._id,
        quantity: ticket.quantity,
        totalAmount: ticket.totalAmount,
        status: ticket.status,
        createdAt: ticket.createdAt,
        events: event
          ? {
              id: event._id,
              title: event.title,
              venueName: event.venueName,
              city: event.city,
              isOnline: event.isOnline,
              eventImages: (event.images || []).map((img) => ({ imageUrl: img.url }))
            }
          : null,
        eventDates: ticket.eventDate
          ? {
              eventDate: ticket.eventDate.eventDate,
              startTime: ticket.eventDate.startTime
            }
          : null
      };
    });

    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("eventId");
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const event = ticket.eventId;
    const response = {
      id: ticket._id,
      quantity: ticket.quantity,
      totalAmount: ticket.totalAmount,
      status: ticket.status,
      createdAt: ticket.createdAt,
      events: event
        ? {
            id: event._id,
            title: event.title,
            venueName: event.venueName,
            city: event.city,
            isOnline: event.isOnline,
            eventImages: (event.images || []).map((img) => ({ imageUrl: img.url }))
          }
        : null,
      eventDates: ticket.eventDate
        ? {
            eventDate: ticket.eventDate.eventDate,
            startTime: ticket.eventDate.startTime
          }
        : null
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  listMine,
  getById
};
