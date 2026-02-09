const Event = require("../models/Event");
const EventLike = require("../models/EventLike");
const Follow = require("../models/Follow");
const { uploadToCloudinary } = require("../middleware/upload");

function parseJsonField(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1";
}

function toEventResponse(event) {
  return {
    id: event._id,
    title: event.title,
    description: event.description,
    category: event.category,
    country: event.country,
    city: event.city,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    price: event.price,
    isFree: event.isFree,
    isOnline: event.isOnline,
    isPromoted: event.isPromoted,
    status: event.status,
    eventHours: event.eventHours,
    refundPolicy: event.refundPolicy,
    organizerId: event.organizerId,
    eventImages: (event.images || []).map((img) => ({
      id: img._id,
      imageUrl: img.url,
      displayOrder: img.displayOrder
    })),
    eventDates: (event.dates || []).map((date) => ({
      id: date._id,
      eventDate: date.eventDate,
      startTime: date.startTime,
      endTime: date.endTime,
      isSoldOut: date.isSoldOut
    })),
    eventPromoters: (event.promoters || []).map((promoter) => ({
      id: promoter._id,
      name: promoter.name
    })),
    eventPaymentMethods: (event.paymentMethods || []).map((method) => ({
      id: method._id,
      bankName: method.bankName,
      accountName: method.accountName,
      accountNumber: method.accountNumber
    })),
    createdAt: event.createdAt
  };
}

async function list(req, res, next) {
  try {
    const {
      status,
      isOnline,
      category,
      search,
      city,
      organizerId,
      ids,
      limit
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (organizerId) query.organizerId = organizerId;
    if (isOnline !== undefined) query.isOnline = parseBool(isOnline);
    if (search) query.title = { $regex: search, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };
    if (ids) query._id = { $in: ids.split(",") };

    const max = Math.min(Number(limit) || 50, 200);

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(max);

    return res.json(events.map(toEventResponse));
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizerId",
      "name avatarUrl email"
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const response = toEventResponse(event);
    response.organizer = event.organizerId
      ? {
          id: event.organizerId._id,
          name: event.organizerId.name,
          email: event.organizerId.email,
          avatarUrl: event.organizerId.avatarUrl
        }
      : null;

    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      country,
      city,
      venueName,
      venueAddress,
      price,
      eventHours,
      refundPolicy,
      status,
      isFree,
      isOnline
    } = req.body;

    if (!title || !category || !city) {
      return res.status(400).json({ message: "Title, category, and city are required" });
    }

    const eventDates = parseJsonField(req.body.eventDates, []);
    const promoters = parseJsonField(req.body.promoters, []);
    const paymentMethods = parseJsonField(req.body.paymentMethods, []);

    const uploadFiles = req.files?.images || [];
    const uploadedUrls = await Promise.all(
      uploadFiles.map((file) => uploadToCloudinary(file, "brite/events"))
    );
    const images = uploadedUrls
      .filter((url) => !!url)
      .map((url, index) => ({
        url,
        displayOrder: index
      }));

    const event = await Event.create({
      title,
      description,
      category,
      country,
      city,
      venueName,
      venueAddress,
      price: Number(price) || 0,
      eventHours,
      refundPolicy,
      status: status || "active",
      isFree: parseBool(isFree),
      isOnline: parseBool(isOnline),
      images,
      dates: eventDates.map((date) => ({
        _id: date.id,
        eventDate: date.eventDate,
        startTime: date.startTime,
        endTime: date.endTime || "",
        isSoldOut: !!date.isSoldOut
      })),
      promoters: promoters.map((name) => ({ name })),
      paymentMethods: paymentMethods.map((method) => ({
        bankName: method.bankName,
        accountName: method.accountName,
        accountNumber: method.accountNumber
      })),
      organizerId: req.user.sub
    });

    return res.status(201).json(toEventResponse(event));
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const removeImageIds = parseJsonField(req.body.removeImageIds, []);

    if (Array.isArray(removeImageIds) && removeImageIds.length > 0) {
      event.images = event.images.filter((img) => !removeImageIds.includes(img._id.toString()));
    }

    const newFiles = req.files?.images || [];
    const newUrls = await Promise.all(
      newFiles.map((file) => uploadToCloudinary(file, "brite/events"))
    );
    const uploadedImages = newUrls
      .filter((url) => !!url)
      .map((url, index) => ({
        url,
        displayOrder: (event.images?.length || 0) + index
      }));

    event.images = [...(event.images || []), ...uploadedImages];

    const eventDates = parseJsonField(req.body.eventDates, null);
    if (eventDates) {
      event.dates = eventDates.map((date) => ({
        _id: date.id,
        eventDate: date.eventDate,
        startTime: date.startTime,
        endTime: date.endTime || "",
        isSoldOut: !!date.isSoldOut
      }));
    }

    const promoters = parseJsonField(req.body.promoters, null);
    if (promoters) {
      event.promoters = promoters.map((name) => ({ name }));
    }

    const paymentMethods = parseJsonField(req.body.paymentMethods, null);
    if (paymentMethods) {
      event.paymentMethods = paymentMethods.map((method) => ({
        bankName: method.bankName,
        accountName: method.accountName,
        accountNumber: method.accountNumber
      }));
    }

    const updateFields = [
      "title",
      "description",
      "category",
      "country",
      "city",
      "venueName",
      "venueAddress",
      "eventHours",
      "refundPolicy",
      "status"
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) {
      event.price = Number(req.body.price) || 0;
    }

    if (req.body.isFree !== undefined) {
      event.isFree = parseBool(req.body.isFree);
    }

    if (req.body.isOnline !== undefined) {
      event.isOnline = parseBool(req.body.isOnline);
    }

    await event.save();

    return res.json(toEventResponse(event));
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await event.deleteOne();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function engagement(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const followerCount = await Follow.countDocuments({ followingId: event.organizerId });
    const organizerEventCount = await Event.countDocuments({
      organizerId: event.organizerId,
      status: "active"
    });

    let liked = false;
    let following = false;

    if (req.user?.sub) {
      const [likeDoc, followDoc] = await Promise.all([
        EventLike.findOne({ userId: req.user.sub, eventId: event._id }),
        Follow.findOne({ followerId: req.user.sub, followingId: event.organizerId })
      ]);

      liked = !!likeDoc;
      following = !!followDoc;
    }

    return res.json({ liked, following, followerCount, organizerEventCount });
  } catch (error) {
    return next(error);
  }
}

async function toggleLike(req, res, next) {
  try {
    const existing = await EventLike.findOne({ userId: req.user.sub, eventId: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    await EventLike.create({ userId: req.user.sub, eventId: req.params.id });
    return res.json({ liked: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  engagement,
  toggleLike
};
