const express = require("express");
const {
  summarizePdfController,
  getAllSummariesController,
  getOverallSummaryController,
  deleteSummaryController,
  upload,
  getOverallHistoryController,
  getOverallSummaryByIdController,
  deleteOverallSummaryController,
} = require("../controllers/summarizeController");

const router = express.Router();

// POST /api/summarize
// The 'upload.single('file')' middleware processes a single file uploaded with the field name 'file'.
router.post("/summarize", upload.single("file"), summarizePdfController);
// GET /api/overall-summary
router.get("/overall-summary", getOverallSummaryController);
// GET /api/overall-history
router.get("/overall-history", getOverallHistoryController); // New: history endpoint
// GET /api/overall-summary/:id
router.get("/overall-summary/:id", getOverallSummaryByIdController); // New: fetch by id
// DELETE /api/summaries/:id
router.delete("/summaries/:id", deleteSummaryController);
// DELETE /api/overall-summary/:id
router.delete("/overall-summary/:id", deleteOverallSummaryController);

module.exports = router;
