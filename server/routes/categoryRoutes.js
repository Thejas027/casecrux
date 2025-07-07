const express = require("express");
const axios = require("axios");
const router = express.Router();

// Set your ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://casecrux.onrender.com";

// 🔧 DEBUG: Log initialization

// Route for category overall summary
router.post("/category-overall-summary", async (req, res) => {
  
  .toISOString());
  );

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category`, req.body, {
      timeout: 300000, // 5 minute timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString()
    });
  }
});

// Route for listing PDFs in category
router.post("/list-pdfs-in-category", async (req, res) => {
  
  .toISOString());
  );

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/list_pdfs_in_category`, req.body, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during PDF listing",
      category: req.body?.category,
      timestamp: new Date().toISOString()
    });
  }
});

// Route for category download summary
router.post("/category-download-summary", async (req, res) => {
  
  .toISOString());
  );

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category_download`, req.body, {
      timeout: 600000, // 10 minute timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {

    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category download summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
