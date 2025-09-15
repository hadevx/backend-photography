const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getLatestProducts,
  createCategory,
  getCategories,
  deleteCategory,
  getAllProducts,
  fetchProductsByIds,
  featuredProducts,
} = require("../controllers/productController");
const { protectUser, protectAdmin } = require("../middleware/authMiddleware");

// /api/products

/* PRODUCTS */
router.get("/latest", getLatestProducts);
router.get("/featured", featuredProducts);
router.get("/", getProducts);
router.get("/all", getAllProducts);
router.post("/", protectUser, protectAdmin, createProduct);
router.post("/fetch-by-ids", fetchProductsByIds);
/* CATEGORY */
router.post("/create-category", protectUser, protectAdmin, createCategory);
router.delete("/category", protectUser, protectAdmin, deleteCategory);
router.get("/category", getCategories);

router.get("/category/:id", getProductsByCategory);

router.get("/:id", getProductById);
router.put("/:id", protectUser, protectAdmin, updateProduct);

router.delete("/:id", protectUser, protectAdmin, deleteProduct);
router.get("/product/:id", getProductById);

module.exports = router;
