const express = require("express");
const cloudinary = require("cloudinary").v2;
const logger = require("../utils/logger");
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/cloudinary-list-files-by-category
router.post("/cloudinary-list-files-by-category", async (req, res) => {
  const { category } = req.body;
  if (!category) {
    logger.warn("Category is required in cloudinary-list-files-by-category", {
      ip: req.ip,
    });
    return res.status(400).json({ error: "Category is required." });
  }
  try {
    const folderPath = `pdfs/${category}`;
    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      resource_type: "auto",
      max_results: 100,
    });
    const files = resources.resources
      .filter((r) => r.format === "pdf")
      .map((r) => ({
        public_id: r.public_id,
        filename: r.public_id.split("/").pop(),
        secure_url: r.secure_url,
        format: r.format,
        bytes: r.bytes,
        created_at: r.created_at,
        resource_type: r.resource_type,
      }));
    logger.info("Listed files from Cloudinary by category", {
      category,
      count: files.length,
    });
    res.json({ files });
  } catch (error) {
    logger.error("Failed to list files from Cloudinary", {
      error: error.message,
      category,
    });
    res.status(500).json({
      error: "Failed to list files from Cloudinary.",
      details: error.message,
    });
  }
});

module.exports = router;
