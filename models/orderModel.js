const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Customer who books
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Plan", // Which photography package they chose
    },
    notes: {
      type: String,
    },
    bookingDate: {
      type: Date,
      required: true, // Date/time of the session
    },
    slot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    location: {
      type: String,
      required: true, // e.g., "Central Park, NY"
    },
    selectedAddOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        _id: { type: mongoose.Schema.Types.ObjectId, required: false }, // optional if you want to store reference
      },
    ],
    numberOfPeople: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 4,
    },
    downPayment: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true, // locked price of the chosen plan
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    isCanceled: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
