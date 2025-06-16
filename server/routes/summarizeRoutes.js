const express = require("express");
const upload = require("../middleware/multerUpload"); // Corrected import for multer

const {
  uploadAndSummarizePdf,
  getAllUniqueIndividualSummaries,
  getIndividualSummaryById,
  deleteIndividualSummaryById,
} = require("../controllers/individualSummaryController");

const {
  generateOrUpdateOverallSummary,
  getOverallSummaryHistoryList,
  getOverallSummaryDetailsById,
  deleteOverallSummaryById,
} = require("../controllers/overallSummaryController");

const {
  uploadAndAnalyzeMultiplePdfs,
} = require("../controllers/multiDocumentController");

const router = express.Router();

// --- Individual Summary Routes ---
router.post("/individual/upload", upload.single("file"), uploadAndSummarizePdf);
router.get("/individual", getAllUniqueIndividualSummaries);
router.get("/individual/:id", getIndividualSummaryById);
router.delete("/individual/:id", deleteIndividualSummaryById);

// --- Overall Summary Routes ---
router.post("/overall/generate", generateOrUpdateOverallSummary);
router.get("/overall/history", getOverallSummaryHistoryList);
router.get("/overall/:id", getOverallSummaryDetailsById);
router.delete("/overall/:id", deleteOverallSummaryById);

// --- Multi-Document Summary Routes ---
router.post(
  "/multi/upload",
  upload.array("files", 10), // Assuming max 10 files for multi-upload
  uploadAndAnalyzeMultiplePdfs
);

module.exports = router;
