const express = require("express");
const router = express.Router();
const { protectUser, protectAdmin } = require("../middleware/authMiddleware");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  markBookingAsPaid,
  markBookingAsCompleted,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingControllers");

// Base URL: /api/orders

// User creates a booking
router.post("/", protectUser, createBooking);

// User’s own bookings
router.get("/mine", protectUser, getMyBookings);

// Single booking (for user or admin)
router.get("/:id", protectUser, getBookingById);

// Photographer/Admin views all bookings
router.get("/", protectUser, protectAdmin, getAllBookings);

// Booking updates
router.put("/:id/pay", protectUser, markBookingAsPaid);
router.put("/:id/complete", protectUser, protectAdmin, markBookingAsCompleted);
router.put("/:id/cancel", protectUser, cancelBooking);

module.exports = router;
