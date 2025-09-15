const mongoose = require("mongoose");

const timeSchema = new mongoose.Schema(
  {
    date: {
      type: Date, // e.g. 2025-09-15
      required: true,
    },
    times: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reserved: { type: Boolean, default: false },
        reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

const Time = mongoose.model("Time", timeSchema);

module.exports = Time;
