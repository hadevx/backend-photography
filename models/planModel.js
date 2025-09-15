const mongoose = require("mongoose");
const { Schema } = mongoose;

const planSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // The photographer (admin who created the plan)
    },
    name: {
      type: String,
      required: true, // e.g., "Wedding Package", "Portrait Session", "Event Coverage"
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // e.g., Wedding, Portrait, Event
    },
    description: {
      type: String,
      required: true, // explain what's included in the plan
    },
    duration: {
      type: String,
      required: true, // e.g., "2 hours", "Full Day", "30 mins"
    },
    price: {
      type: Number,
      required: true, // base price
    },
    features: [
      {
        type: String, // e.g., "20 Edited Photos", "Online Gallery", "2 Locations"
      },
    ],

    addOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, default: 0 },
      },
    ],

    discount: {
      type: Number,
      default: 0, // 0.10 = 10%
    },
    discountedPrice: {
      type: Number,
      default: 0, // calculated price after discount
    },
    hasDiscount: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false, // highlight special plans on the website
    },
    published: {
      type: Boolean,
      default: false, // can toggle availability
    },
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
