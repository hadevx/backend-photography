const dotenv = require("dotenv");
const users = require("./data/users.js");

const User = require("./models/userModel.js");
const Portfolio = require("./models/portfolioModel.js");
const Plan = require("./models/planModel.js");
const Order = require("./models/orderModel.js");
const Store = require("./models/storeModel.js");
const Category = require("./models/categoryModel.js");

const dbConnect = require("./config/db.js");

dotenv.config();
dbConnect();

const seedData = async () => {
  try {
    await Order.deleteMany();
    await Portfolio.deleteMany();
    await Plan.deleteMany();
    await User.deleteMany();
    await Store.deleteMany();
    await Category.deleteMany();

    await User.create(users[0]);
    await Store.create({ status: "active" });

    console.log("Data seeded");
    process.exit();
  } catch (error) {
    console.log(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Plan.deleteMany();
    await Portfolio.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    await Store.deleteMany();

    console.log("Data destroyed");
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  seedData();
}
