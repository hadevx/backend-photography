const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const sharp = require("sharp");

// Make sure uploads folder exists inside container
const planUploadPath = "/app/uploads/plans";
const categoryUploadPath = "/app/uploads/categories";
const portfolioUploadPath = "/app/uploads/portfolio";

if (!fs.existsSync(planUploadPath)) {
  fs.mkdirSync(planUploadPath, { recursive: true });
}
if (!fs.existsSync(categoryUploadPath)) fs.mkdirSync(categoryUploadPath, { recursive: true });
if (!fs.existsSync(portfolioUploadPath)) fs.mkdirSync(portfolioUploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, planUploadPath),
  filename: (req, file, cb) => {
    // Get original name without extension
    const name = path.parse(file.originalname).name.replace(/\s+/g, "-").toLowerCase();
    // Get file extension
    const ext = path.extname(file.originalname);
    // Combine name + timestamp + extension
    const filename = `${name}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Multer storage for categories
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoryUploadPath),
  filename: (req, file, cb) => {
    const name = path.parse(file.originalname).name.replace(/\s+/g, "-").toLowerCase();
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const uploadCategory = multer({ storage: categoryStorage });

// Multer storage for variants
const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, portfolioUploadPath),
  filename: (req, file, cb) => {
    const name = path.parse(file.originalname).name.replace(/\s+/g, "-").toLowerCase();
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const uploadVariant = multer({ storage: portfolioStorage });

//plans
router.post("/plans", upload.array("images", 3), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  try {
    const optimizedFiles = [];

    for (const file of req.files) {
      const optimizedName = `optimized-${file.filename}.webp`;
      const outputPath = path.join(planUploadPath, optimizedName);

      // Optimize image with Sharp
      await sharp(file.path)
        .resize({ width: 800 }) // Resize to max width 800px
        .webp({ quality: 80 }) // Convert to WebP with 80% quality
        .toFile(outputPath);

      // Remove original uploaded file to save space
      fs.unlinkSync(file.path);

      const fullUrl = `${req.protocol}://${req.get("host")}/uploads/plans/${optimizedName}`;
      optimizedFiles.push({
        imageUrl: fullUrl,
        publicId: optimizedName,
      });
    }

    res.json({
      message: "Images uploaded and optimized",
      images: optimizedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Image processing failed", error: err.message });
  }
});
/* ----------------- Category Image (single) ----------------- */
router.post("/category", uploadCategory.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const optimizedName = `optimized-${req.file.filename}.webp`;
    const outputPath = path.join(categoryUploadPath, optimizedName);

    await sharp(req.file.path).resize({ width: 800 }).webp({ quality: 80 }).toFile(outputPath);

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Category image uploaded",
      image: {
        imageUrl: `${req.protocol}://${req.get("host")}/uploads/categories/${optimizedName}`,
        publicId: optimizedName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Image processing failed", error: err.message });
  }
});

/* ----------------- Portfolio Images (multiple) ----------------- */
router.post("/portfolio", uploadVariant.array("images", 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  try {
    const optimizedFiles = [];

    for (const file of req.files) {
      const optimizedName = `optimized-${file.filename}.webp`;
      const outputPath = path.join(portfolioUploadPath, optimizedName);

      // Optimize image with Sharp
      await sharp(file.path)
        .resize({ width: 800 }) // resize max width
        .webp({ quality: 80 }) // convert to webp
        .toFile(outputPath);

      // remove original
      fs.unlinkSync(file.path);

      const fullUrl = `${req.protocol}://${req.get("host")}/uploads/portfolio/${optimizedName}`;
      optimizedFiles.push({
        imageUrl: fullUrl,
        publicId: optimizedName,
      });
    }

    res.json({
      message: "Variant images uploaded",
      images: optimizedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Variant image upload failed", error: err.message });
  }
});
module.exports = router;
