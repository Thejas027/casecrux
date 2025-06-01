const express = require("express");
const {
  summarizePdfController,
  upload,
} = require("../controllers/summarizeController");

const router = express.Router();

// POST /api/summarize
// The 'upload.single('file')' middleware processes a single file uploaded with the field name 'file'.
router.post("/summarize", upload.single("file"), summarizePdfController);

module.exports = router;
