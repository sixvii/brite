const Event = require("../models/Event");
const Ticket = require("../models/Ticket");

function toEventResponse(event) {
  return {
    id: event._id,
    title: event.title,
    city: event.city,
    price: event.price,
    isFree: event.isFree,
    isPromoted: event.isPromoted,
    eventImages: (event.images || []).map((img) => ({ imageUrl: img.url })),
    eventDates: (event.dates || []).map((date) => ({
      eventDate: date.eventDate,
      startTime: date.startTime
    }))
  };
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.sub;

    const createdEvents = await Event.find({ organizerId: userId })
      .sort({ createdAt: -1 })
      .limit(200);

    const attendingTickets = await Ticket.find({ userId, status: "verified" });
    const attendingIds = attendingTickets.map((ticket) => ticket.eventId);

    const attendingEvents = attendingIds.length
      ? await Event.find({ _id: { $in: attendingIds } })
      : [];

    const createdRevenue = createdEvents.reduce((sum, event) => {
      return sum + (event.isFree ? 0 : event.price || 0);
    }, 0);

    return res.json({
      createdEvents: createdEvents.map(toEventResponse),
      attendingEvents: attendingEvents.map(toEventResponse),
      stats: {
        created: createdEvents.length,
        attending: attendingEvents.length,
        revenue: createdRevenue
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard
};
