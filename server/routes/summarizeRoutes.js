const express = require("express");
const {
  summarizePdfController,
  getAllSummariesController,
  getOverallSummaryController,
  deleteSummaryController,
  upload,
} = require("../controllers/summarizeController");

const router = express.Router();

// POST /api/summarize
// The 'upload.single('file')' middleware processes a single file uploaded with the field name 'file'.
router.post("/summarize", upload.single("file"), summarizePdfController);
// GET /api/summaries
router.get("/summaries", getAllSummariesController);
// GET /api/overall-summary
router.get("/overall-summary", getOverallSummaryController);
// DELETE /api/summaries/:id
router.delete("/summaries/:id", deleteSummaryController);

module.exports = router;
