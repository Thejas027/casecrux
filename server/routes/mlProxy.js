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

// NEW: Advanced summarization endpoint
router.post("/ml/advanced_summarize", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/advanced_summarize`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get advanced summary from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// NEW: Summary comparison endpoint
router.post("/ml/compare_summaries", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/compare_summaries`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get summary comparison from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// NEW: Summary options endpoint
router.get("/ml/summary_options", async (req, res) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/summary_options`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get summary options from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

// NEW: Batch advanced summarization endpoint
router.post("/ml/batch_advanced_summarize", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/batch_advanced_summarize`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get batch advanced summary from ML service.",
      details: error.response?.data?.error || error.message,
    });
  }
});

module.exports = router;
