const express = require("express");
const UploadedPdf = require("../models/UploadedPdf");
const logger = require("../utils/logger");
const router = express.Router();

// POST /api/list-uploaded-pdfs-by-category
router.post("/list-uploaded-pdfs-by-category", async (req, res) => {
  const { category } = req.body;
  if (!category) {
    logger.warn("Category is required in list-uploaded-pdfs-by-category", {
      ip: req.ip,
    });
    return res.status(400).json({ error: "Category is required." });
  }
  try {
    const pdfs = await UploadedPdf.find({ category }).sort({ created_at: -1 });
    logger.info("Listed PDFs by category", { category, count: pdfs.length });
    res.json({ files: pdfs });
  } catch (error) {
    logger.error("Failed to list PDFs from DB", {
      error: error.message,
      category,
    });
    res
      .status(500)
      .json({ error: "Failed to list PDFs from DB.", details: error.message });
  }
});

module.exports = router;
