const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const UploadedPdf = require("../models/UploadedPdf");
const logger = require("../utils/logger");
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/cloudinary-upload
router.post("/cloudinary-upload", upload.single("file"), async (req, res) => {
  const category = req.body.category ? req.body.category.trim() : "";
  if (!req.file) {
    logger.warn("No file uploaded in request", { ip: req.ip });
    return res.status(400).json({ error: "No file uploaded." });
  }
  try {
    // If category is provided, upload to pdfs/<category>/, else to pdfs/
    const folderPath = category ? `pdfs/${category}` : "pdfs";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: folderPath,
        public_id: req.file.originalname.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      async (error, result) => {
        if (error) {
          logger.error("Cloudinary upload failed", {
            error: error.message,
            file: req.file.originalname,
            category,
          });
          return res.status(500).json({
            error: "Cloudinary upload failed.",
            details: error.message,
          });
        }
        // Store metadata in MongoDB
        try {
          await UploadedPdf.findOneAndUpdate(
            { public_id: result.public_id },
            {
              public_id: result.public_id,
              url: result.secure_url,
              filename: req.file.originalname,
              category,
              bytes: result.bytes,
              format: result.format,
              created_at: result.created_at,
              resource_type: result.resource_type,
              folder: folderPath,
            },
            { upsert: true, new: true }
          );
          logger.info("PDF metadata saved to DB", {
            public_id: result.public_id,
            category,
          });
        } catch (dbErr) {
          logger.error("Failed to save PDF metadata to DB", {
            error: dbErr.message,
            public_id: result.public_id,
          });
        }
        logger.info("PDF uploaded to Cloudinary", {
          public_id: result.public_id,
          url: result.secure_url,
          category,
        });
        res.json({
          url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          format: result.format,
          created_at: result.created_at,
          resource_type: result.resource_type,
          folder: folderPath,
        });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error("Failed to upload file to Cloudinary", {
      error: error.message,
      file: req.file?.originalname,
    });
    res.status(500).json({
      error: "Failed to upload file to Cloudinary.",
      details: error.message,
    });
  }
});

module.exports = router;
