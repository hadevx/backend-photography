const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const { sendRestPasswordEmail } = require("../utils/emailService");
const crypto = require("crypto");

// @desc    Login user & get token
// @route   POST /api/users/login
// @access  public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  generateToken(res, user);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
  });
});

// @desc    Login user & get token
// @route   POST /api/admin/login
// @access  public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isAdmin) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  generateToken(res, user);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
  });
});

// @desc    Register user
// @route   POST /api/users
// @access  public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, age, password, confirmPassword, phone } = req.body;

  if (!name || !email || !age || !password || !confirmPassword || !phone) {
    res.status(400);
    throw new Error("Invalid user data");
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, age, email, password: hashedPassword, phone });

  if (!user) {
    res.status(400);
    throw new Error("User creation failed");
  }

  generateToken(res, user);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    age: user.age,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: new Date(0),
  });
  res.status(200).json({ message: "User logged out successfully" });
});

const logoutAdmin = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Admin logged out successfully" });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 5; // number of users per page
  const page = Number(req.query.pageNumber) || 1;

  // Optional search by name or email
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: "i" } },
          { email: { $regex: req.query.keyword, $options: "i" } },
        ],
      }
    : {};

  // Count total users matching the search
  const count = await User.countDocuments({ ...keyword });

  // Paginate + sort newest first
  const users = await User.find({ ...keyword })
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize), // total pages
    total: count, // total users
  });
});

// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Private/admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    // If user is not found, respond with 404
    res.status(404);
    throw new Error("User not found");
  }
  if (user.isAdmin) {
    res.status(400);
    throw new Error("Cannot delete admin user");
  }

  await User.findByIdAndDelete({ _id: user._id });
  res.status(200).json({ message: "User deleted successfully" });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { name, email, isAdmin } = req.body;

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.isAdmin = Boolean(isAdmin);

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save();

  const resetURL = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;
  await sendRestPasswordEmail(
    process.env.ADMIN_EMAIL,
    "Password Reset Request",
    `
  Hello,

  We received a request to reset your password.  
  If you made this request, please click the link below to set a new password:

  ${resetURL}

  If you did not request a password reset, please ignore this email.  
  For security, this link will expire in 15 minutes.

  Best regards,  
  WEBSCHEMA
  `
  );

  res.json({ message: "Reset link sent to email" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  loginAdmin,
  forgetPassword,
  resetPassword,
  logoutAdmin,
};
