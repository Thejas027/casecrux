const mongoose = require("mongoose");
const config = require("./index");

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
