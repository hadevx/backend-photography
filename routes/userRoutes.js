const express = require("express");
const router = express.Router();
const { protectUser, protectAdmin } = require("../middleware/authMiddleware");
const { registerLimiter, loginLimiter } = require("../utils/registerLimit");
const {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  loginAdmin,
  forgetPassword,
  resetPassword,
} = require("../controllers/userController");
const { registerValidation, loginValidation } = require("../middleware/validateMiddleware");
/* /api/users */

// Client routes
router.post("/login", loginValidation, loginUser);
router.post("/register", registerLimiter, registerValidation, registerUser);

router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.post("/logout", logoutUser);

// Admin routes
router.post("/admin", loginLimiter, loginValidation, loginAdmin);

router.get("/", protectUser, protectAdmin, getUsers);
router.put("/:id", protectUser, updateUser);
router.delete("/:id", protectUser, protectAdmin, deleteUser);
router.get("/:id", protectUser, protectAdmin, getUserById);

router.post("/admin/logout", logoutUser);

router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
