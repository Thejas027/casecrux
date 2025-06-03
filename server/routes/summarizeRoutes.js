const express = require("express");
const {
  summarizePdfController,
  upload,
  multiPdfSummarizeController,
} = require("../controllers/summarizeController");

const router = express.Router();

// POST /api/summarize
// The 'upload.single('file')' middleware processes a single file uploaded with the field name 'file'.
router.post("/summarize", upload.single("file"), summarizePdfController);

// POST /api/multi-summarize
// Accepts multiple files and a caseid
router.post(
  "/multi-summarize",
  upload.array("files", 10), // up to 10 files
  multiPdfSummarizeController
);

module.exports = router;
