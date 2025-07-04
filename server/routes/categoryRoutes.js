const express = require("express");
const axios = require("axios");
const router = express.Router();

// Set your ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://casecrux.onrender.com";

// 🔧 DEBUG: Log initialization
console.log("🚀 Category Routes Initialized");
console.log("🔗 ML Service URL:", ML_SERVICE_URL);

// Route for category overall summary
router.post("/category-overall-summary", async (req, res) => {
  console.log("\n🔄 POST /category-overall-summary - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category`, req.body, {
      timeout: 300000, // 5 minute timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log("✅ Category overall summary successful");
    console.log("📊 Response status:", response.status);
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ Category overall summary failed:", error.message);
    console.error("📊 Error details:", error.response?.data);
    
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
  console.log("\n🔄 POST /list-pdfs-in-category - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/list_pdfs_in_category`, req.body, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log("✅ List PDFs in category successful");
    console.log("📊 Response status:", response.status);
    console.log("📊 PDFs found:", response.data?.pdfs?.length || 0);
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ List PDFs in category failed:", error.message);
    console.error("📊 Error details:", error.response?.data);
    
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
  console.log("\n🔄 POST /category-download-summary - Starting request");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
  console.log("📁 Category:", req.body?.category || 'undefined');

  try {
    // Forward the request to the ML service
    const response = await axios.post(`${ML_SERVICE_URL}/summarize_category_download`, req.body, {
      timeout: 600000, // 10 minute timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log("✅ Category download summary successful");
    console.log("📊 Response status:", response.status);
    console.log("📊 Summaries found:", response.data?.summaries?.length || 0);
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ Category download summary failed:", error.message);
    console.error("📊 Error details:", error.response?.data);
    
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error during category download summarization",
      category: req.body?.category,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
