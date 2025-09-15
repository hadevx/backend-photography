const express = require("express");
const router = express.Router();
const { protectUser, protectAdmin } = require("../middleware/authMiddleware");

const {
  createTime,
  getAllTimes,
  deleteTime,
  updateTime,
} = require("../controllers/timeControllers");

router.post("/", createTime);
router.get("/", getAllTimes);
router.delete("/:id", deleteTime);
router.put("/:id", updateTime);

module.exports = router;
