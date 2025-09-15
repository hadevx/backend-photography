const { protectUser, protectAdmin } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const {
  createPlan,
  getPlans,
  getPlanById,
  deletePlan,
  updatePlan,
} = require("../controllers/planControllers");

// api/plans
router.post("/", protectUser, protectAdmin, createPlan);
router.get("/", protectUser, protectAdmin, getPlans);
router.get("/:id", getPlanById);
router.delete("/:id", deletePlan);
router.put("/:id", updatePlan);

module.exports = router;
