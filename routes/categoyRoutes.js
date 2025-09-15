const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");
const { protectUser, protectAdmin } = require("../middleware/authMiddleware");
const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  getMainCategoriesWithCounts,
  getPlansByCategory,
} = require("../controllers/categoryControllers");

// Create a category or subcategory
router.post("/", protectUser, protectAdmin, createCategory);

// Delete a category by name
router.delete("/", protectUser, protectAdmin, deleteCategory);

// Get all categories (flat list)
router.get("/", getCategories);
router.get("/main-cat-count", getMainCategoriesWithCounts);
router.put("/:id", protectUser, protectAdmin, updateCategory);

const getAllCategories = async (req, res) => {
  const categories = await Category.find().populate("parent", "name");
  res.json(categories);
};

router.get("/all", getAllCategories);
router.get("/plans/:id", getPlansByCategory);

// Get categories as a tree
const getCategoryTree = async (parentId = null) => {
  const categories = await Category.find({ parent: parentId });
  return Promise.all(
    categories.map(async (cat) => ({
      _id: cat._id,
      name: cat.name,
      image: cat.image,
      children: await getCategoryTree(cat._id),
    }))
  );
};

router.get("/tree", async (req, res) => {
  const tree = await getCategoryTree();
  res.json(tree);
});

module.exports = router;
