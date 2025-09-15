const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/db.js");
const dotenv = require("dotenv");

const {
  productRoutes,
  userRoutes,
  bookingRoutes,
  uploadRoutes,
  storeRoutes,
  categoryRoutes,
  paymentRoutes,
  planRoutes,
  timeRoutes,
} = require("./routes/index.js");

const { notFound, errorHandle } = require("./middleware/errorMiddleware.js");
const cookieParser = require("cookie-parser");

dotenv.config();

// Connect to DB BEFORE starting server
dbConnect();

// Intialize express app
const app = express();

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000", //admin
      "http://localhost:5173", //storefront
      "https://storefront.webschema.online",
      "https://admin.webschema.online",
      "https://storefront2.webschema.online",
      "https://photography.webschema.online",
    ],
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", bookingRoutes);
app.use("/api/update-store-status", storeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/time", timeRoutes);

app.use(
  "/uploads",
  express.static("/app/uploads", {
    maxAge: "30d", // browser cache max-age
    etag: true, // enable ETag headers
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

app.get("/", (req, res) => {
  res.send("API intialized");
});

// Error handlers
app.use(notFound);
app.use(errorHandle);

app.listen(process.env.PORT, (req, res) => {
  console.log("Connecting to DB & Listening on port " + process.env.PORT);
});
