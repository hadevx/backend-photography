const mongoose = require("mongoose");
const { Schema } = mongoose;

const portfolioSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },

    image: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    description: {
      type: String,
      required: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
