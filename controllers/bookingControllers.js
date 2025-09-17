const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/orderModel");
const Time = require("../models/timeModel");
// const { sendBookingEmail } = require("../utils/emailService");

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (customer)
const createBooking = asyncHandler(async (req, res) => {
  const {
    plan,
    bookingDate,
    slot,
    numberOfPeople,
    selectedAddOns,
    downPayment,
    location,
    notes,
    price,
  } = req.body;

  if (!plan || !bookingDate || !location || !price) {
    res.status(400);
    throw new Error("Missing required booking details");
  }

  const booking = new Order({
    user: req.user._id, // logged in customer
    plan,
    bookingDate,
    slot,
    location,
    selectedAddOns,
    notes,
    price,
    numberOfPeople,
    downPayment,
  });

  const createdBooking = await booking.save();
  await Time.updateOne(
    { date: bookingDate, "times.startTime": slot.startTime, "times.endTime": slot.endTime },
    { $set: { "times.$.reserved": true } }
  );

  const populatedBooking = await Order.findById(createdBooking._id)
    .populate("user", "name email")
    .populate("plan", "name description price");

  // Send confirmation email
  // await sendBookingEmail(populatedBooking);

  res.status(201).json(populatedBooking);
});

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(bookings);
});

const getOrders = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  // Optional search
  const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: "i" } } : {};

  const count = await Order.countDocuments({ ...keyword });

  const orders = await Order.find({ ...keyword })
    .sort({ name: 1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Order.findById(req.params.id)
    .populate("user", "name email phone age")
    .populate("plan", "name duration");

  if (booking) {
    res.status(200).json(booking);
  } else {
    res.status(404);
    throw new Error("Booking not found");
  }
});

// @desc    Mark booking as paid
// @route   PUT /api/bookings/:id/pay
// @access  Private
const markBookingAsPaid = asyncHandler(async (req, res) => {
  const booking = await Order.findById(req.params.id);

  if (booking) {
    booking.isPaid = true;
    booking.paidAt = Date.now();
    booking.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer?.email_address,
    };

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } else {
    res.status(404);
    throw new Error("Booking not found");
  }
});

// @desc    Mark booking as completed
// @route   PUT /api/bookings/:id/complete
// @access  Private/Admin
const markBookingAsCompleted = asyncHandler(async (req, res) => {
  const booking = await Order.findById(req.params.id);

  if (booking) {
    booking.isCompleted = true;
    booking.completedAt = Date.now();

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } else {
    res.status(404);
    throw new Error("Booking not found");
  }
});
const markBookingAsConfirmed = asyncHandler(async (req, res) => {
  const booking = await Order.findById(req.params.id);

  if (booking) {
    booking.isConfirmed = true;
    // booking.completedAt = Date.now();

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } else {
    res.status(404);
    throw new Error("Booking not found");
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Order.findById(req.params.id);

  if (booking) {
    booking.isCanceled = true;
    booking.canceledAt = Date.now();

    const updatedBooking = await booking.save();

    // Free up the reserved slot
    await Time.updateOne(
      {
        date: booking.bookingDate,
        "times.startTime": booking.slot.startTime,
        "times.endTime": booking.slot.endTime,
      },
      { $set: { "times.$.reserved": false } }
    );
    res.status(200).json(updatedBooking);
  } else {
    res.status(404);
    throw new Error("Booking not found");
  }
});

// @desc    Get all bookings (admin)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Order.countDocuments();

  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .populate("user", "name email")
    .populate("plan", "name price");

  // Calculate total price of all non-cancelled orders
  const totalPriceAgg = await Order.aggregate([
    { $match: { isCanceled: { $ne: true } } }, // exclude cancelled orders
    {
      $group: {
        _id: null,
        total: { $sum: "$price" }, // sum price field
      },
    },
  ]);

  res.status(200).json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    totalRevenue: totalPriceAgg.length > 0 ? totalPriceAgg[0].total : 0,
  });
});

// @desc    Get all orders by userId
// @route   GET /api/orders/user/:id
// @access  Private (or adjust as needed)
const getOrdersByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params; // userId from URL

  console.log(id);
  const orders = await Order.find({ user: id });

  console.log(orders);
  if (orders && orders.length > 0) {
    res.json(orders);
  } else {
    res.status(404);
    throw new Error("No orders found for this user");
  }
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  markBookingAsPaid,
  markBookingAsCompleted,
  cancelBooking,
  getAllBookings,
  getOrders,
  markBookingAsConfirmed,
  getOrdersByUserId,
};
