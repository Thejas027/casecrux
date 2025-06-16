require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  mlServiceUrl: process.env.ML_SERVICE_URL || "https://casecrux.onrender.com", // Default if not set
};

module.exports = config;
