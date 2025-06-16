const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/category-overall-summary
router.post("/category-overall-summary", async (req, res) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: "Category is required." });
  }
  try {
    // Call ML service for overall summary by category
    const mlServiceBase = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const mlServiceUrl =
      mlServiceBase.replace(/\/$/, "") + "/summarize_category_overall";
    const response = await axios.post(mlServiceUrl, { category });
    res.json(response.data);
  } catch (error) {
    // Enhanced debugging: log and return more details
    let debugInfo = {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      requestUrl: error.config?.url,
      requestData: error.config?.data,
      requestHeaders: error.config?.headers,
    };
    console.error("[CategoryOverallSummary Error]", debugInfo);
    res.status(500).json({
      error: "Failed to get overall summary.",
      details: error.message,
      debug: debugInfo,
    });
  }
});

module.exports = router;
