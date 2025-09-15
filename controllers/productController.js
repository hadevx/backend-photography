const asyncHandler = require("../middleware/asyncHandler");
const Portfolio = require("../models/portfolioModel");
const Category = require("../models/categoryModel");
const fs = require("fs");
const path = require("path");

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Portfolio.find({});
  res.json(products);
});

const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 5;
  const page = Number(req.query.pageNumber) || 1;

  // Search filter
  const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: "i" } } : {};

  // Count total products matching search
  const count = await Portfolio.countDocuments({ ...keyword });

  // Paginate + sort newest first
  const products = await Portfolio.find({ ...keyword })
    .sort({ createdAt: -1 })
    .populate("category", "name")
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// POST /api/products/fetch-by-ids
const fetchProductsByIds = asyncHandler(async (req, res) => {
  const { productIds } = req.body; // array of product _id
  if (!productIds || !Array.isArray(productIds)) {
    res.status(400);
    throw new Error("Invalid product IDs");
  }

  const products = await Portfolio.find({ _id: { $in: productIds } });
  res.json(products);
});

const getLatestProducts = asyncHandler(async (req, res) => {
  const products = await Portfolio.find({}).sort({ createdAt: -1 }).limit(6);

  if (!products || products.length === 0) {
    res.status(404);
    throw new Error("No products found");
  }

  res.status(200).json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  // 1. Fetch the product and populate category
  const product = await Portfolio.findById(req.params.id).populate("category", "name parent");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // 6. Return product + discount info
  res.status(200).json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, image, category, description } = req.body;

  // ✅ Build product object
  const product = {
    user: req.user._id,
    name,
    image,
    category,
    description,
  };

  // ✅ Save to DB
  const createdProduct = await Portfolio.create(product);
  res.status(201).json(createdProduct);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, image, category, featured } = req.body;

  const product = await Portfolio.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Delete old images that are no longer in the new images array
  if (image && Array.isArray(image)) {
    const oldImages = product.image || [];

    for (const oldImg of oldImages) {
      const oldUrl = oldImg.url ? oldImg.url : oldImg;
      const existsInNew = image.some((img) => (img.url ? img.url : img) === oldUrl);

      if (!existsInNew && oldUrl.includes("/uploads/")) {
        const filename = oldUrl.split("/uploads/").pop();
        const filePath = path.join(__dirname, "..", "uploads", filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    product.image = image; // update product images
  }

  // Update other fields
  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.category = category ?? product.category;
  product.featured = featured ?? product.featured;

  const updatedProduct = await product.save();
  res.status(200).json(updatedProduct);
});

const featuredProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Portfolio.find({ featured: true }).limit(6);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get products by category (including children)
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params; // category id from URL

  // 1. Check if category exists
  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // 2. Recursive function to get all child category IDs
  const getAllCategoryIds = async (catId) => {
    const ids = [catId];
    const children = await Category.find({ parent: catId });
    for (const child of children) {
      ids.push(...(await getAllCategoryIds(child._id)));
    }
    return ids;
  };

  // 3. Collect all category IDs (parent + children)
  const categoryIds = await getAllCategoryIds(category._id);

  // 4. Find products belonging to any of those categories
  const products = await Portfolio.find({ category: { $in: categoryIds } }).sort({ createdAt: -1 });

  res.status(200).json(products);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Portfolio.findById(req.params.id);

  if (product) {
    if (product.image && Array.isArray(product.image)) {
      for (const img of product.image) {
        // Delete local file if stored in /uploads/
        if (img.url && img.url.includes("/uploads/")) {
          const filename = img.url.split("/uploads/").pop();
          const filePath = path.join(__dirname, "..", "uploads", filename);
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete local image:", err);
          });
        }
      }
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const checkExists = await Category.findOne({ name: name });
  if (checkExists) {
    res.status(500);
    throw new Error(`Category ${name} already exists`);
  }
  const newCategory = await Category.create({ name: name });

  res.status(201).json(newCategory);
});

const getCategories = asyncHandler(async (req, res) => {
  const pageSize = 10; // number of categories per page
  const page = Number(req.query.pageNumber) || 1;

  // Optional search by name
  const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: "i" } } : {};

  // Total count matching keyword
  const count = await Category.countDocuments({ ...keyword });

  // Fetch paginated categories
  const categories = await Category.find({ ...keyword })
    .sort({ name: 1 }) // optional: sort by name
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200).json({
    categories,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const deleteCategory = await Category.findOneAndDelete({ name: name });
  if (!deleteCategory) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json(deleteCategory);
});

module.exports = {
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
};
