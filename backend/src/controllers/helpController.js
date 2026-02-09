const HelpRequest = require("../models/HelpRequest");

async function create(req, res, next) {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const helpRequest = await HelpRequest.create({
      userId: req.user?.sub || null,
      name,
      email,
      category,
      subject,
      message
    });

    return res.status(201).json(helpRequest);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create
};
