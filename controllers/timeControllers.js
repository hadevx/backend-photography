const asyncHandler = require("../middleware/asyncHandler");
const Time = require("../models/timeModel");

const createTime = asyncHandler(async (req, res) => {
  const { date, times } = req.body;

  if (!date || !times || !Array.isArray(times) || times.length === 0) {
    res.status(400);
    throw new Error("Date and at least one time slot are required");
  }

  // Normalize date (ignore time part)
  const normalizedDate = new Date(date);

  // Check if date document already exists
  let dateDoc = await Time.findOne({ date: normalizedDate });

  if (dateDoc) {
    // Add new time slots, avoiding duplicates
    times.forEach((slot) => {
      const exists = dateDoc.times.some(
        (t) => t.startTime === slot.startTime && t.endTime === slot.endTime
      );
      if (!exists) {
        dateDoc.times.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
    });

    await dateDoc.save();
    res.status(201).json(dateDoc);
  } else {
    // Create new document with time slots
    const newDateDoc = await Time.create({
      date: normalizedDate,
      times: times.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
    res.status(201).json(newDateDoc);
  }
});

const getAllTimes = asyncHandler(async (req, res) => {
  const allTimes = await Time.find({});

  res.status(201).json(allTimes);
});

const deleteTime = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const time = await Time.findByIdAndDelete(id);

  if (!time) {
    res.status(404);
    throw new Error("No time found");
  }

  res.status(200).json(time);
});
const updateTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;

  const time = await Time.findByIdAndUpdate(
    id,
    { startTime, endTime },
    { new: true } // return the updated document
  );

  if (!time) {
    res.status(404);
    throw new Error("No time found");
  }

  res.status(200).json(time);
});

module.exports = { createTime, getAllTimes, deleteTime, updateTime };
