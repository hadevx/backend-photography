const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },

    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
