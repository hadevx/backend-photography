const asyncHandler = require("../middleware/asyncHandler");
const Plan = require("../models/planModel");

const createPlan = asyncHandler(async (req, res) => {
  const { name, addOns, images, category, description, duration, price, features } = req.body;
  if (!name || !category || !description || !duration || !price) {
    res.status(400);
    throw new Error("Missing required fields");
  }
  const plan = {
    user: req.user._id,
    name,
    images,
    category,
    description,
    duration,
    price,
    features,
    addOns: addOns || [],
  };

  const createdPlan = await Plan.create(plan);
  res.status(201).json(createdPlan);
});

const getPlans = asyncHandler(async (req, res) => {
  const pageSize = 5;
  const page = Number(req.query.pageNumber) || 1;

  // Search filter
  const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: "i" } } : {};

  // Count total products matching search
  const count = await Plan.countDocuments({ ...keyword });

  // Paginate + sort newest first
  const plans = await Plan.find({ ...keyword })
    .sort({ createdAt: -1 })
    .populate("category", "name")
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    plans,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findById(id).populate("category");

  if (!plan) {
    res.status(404);
    throw new Error("Plan not found");
  }

  res.json(plan);
});
const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) {
    res.status(404);
    throw new Error("Plan not found");
  }

  res.status(200).json(plan);
});
const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findById(id);

  if (!plan) {
    res.status(404);
    throw new Error("Plan not found");
  }

  // Update fields
  const {
    name,
    hasDiscount,
    discountBy,
    description,
    duration,
    price,
    isFeatured,
    published,
    features,
    addOns,
    images,
  } = req.body;

  plan.name = name ?? plan.name;
  plan.description = description ?? plan.description;
  plan.duration = duration ?? plan.duration;
  plan.price = price ?? plan.price;
  plan.isFeatured = isFeatured ?? plan.isFeatured;
  plan.published = published ?? plan.published;
  plan.features = features ?? plan.features;
  plan.addOns = addOns ?? plan.addOns;
  plan.images = images ?? plan.images;

  // Discount handling
  plan.hasDiscount = hasDiscount ?? plan.hasDiscount;
  plan.discountBy = discountBy ?? plan.discountBy;
  plan.discountedPrice = hasDiscount ? plan.price - plan.price * discountBy : plan.price;

  const updatedPlan = await plan.save();

  res.status(200).json(updatedPlan);
});

module.exports = {
  createPlan,
  getPlans,
  getPlanById,
  deletePlan,
  updatePlan,
};
