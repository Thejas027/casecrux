const express = require("express");
const axios = require("axios");
const router = express.Router();

// Set your Render ML service URL in .env as ML_SERVICE_URL
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://your-ml-service.onrender.com";

// Proxy route to forward summarize_from_urls requests to ML service
router.post("/ml/summarize_from_urls", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/summarize_from_urls`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get summary from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

module.exports = router;
