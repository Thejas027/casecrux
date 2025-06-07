const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data"); // Added
const Summary = require("../models/Summary");
const MultiSummary = require("../models/MultiSummary"); // Import MultiSummary

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Store summary after single PDF summarization
const summarizePdfController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const mlServiceUrl = "https://casecrux.onrender.com/summarize";
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
    });
    const response = await axios.post(mlServiceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 300000,
    });
    // Prevent duplicate summary for same PDF name
    const { caseid } = req.body; // allow client to send a caseid
    let summaryDoc = await Summary.findOne({ pdfName: req.file.originalname });
    const category =
      response.data.summary.category ||
      (response.data.summary && response.data.summary.category) ||
      null;
    if (summaryDoc) {
      // Update existing summary
      summaryDoc.summary = response.data.summary;
      summaryDoc.caseId = caseid || summaryDoc.caseId || "default-case";
      summaryDoc.category = category;
      await summaryDoc.save();
    } else {
      summaryDoc = await Summary.create({
        caseId: caseid || "default-case",
        pdfName: req.file.originalname,
        summary: response.data.summary,
        category: category,
      });
    }
    res.json({
      _id: summaryDoc._id,
      pdfName: summaryDoc.pdfName,
      summary: summaryDoc.summary,
      category: summaryDoc.category,
    });
  } catch (error) {
    console.error("Error calling ML service:", error.message);
    if (error.response) {
      console.error("ML Service Response:", error.response.data);
      return res.status(error.response.status || 500).json({
        error: "Error from ML service.",
        details: error.response.data,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to summarize PDF.", details: error.message });
  }
};

// GET /api/summaries - return all summaries (unique by pdfName, latest wins)
const getAllSummariesController = async (req, res) => {
  try {
    // Get all summaries, sort by createdAt descending (latest first)
    const all = await Summary.find({}, { __v: 0 }).sort({ createdAt: -1 });
    // Filter to only unique pdfName (latest wins)
    const seen = new Set();
    const summaries = [];
    for (const s of all) {
      if (!seen.has(s.pdfName)) {
        summaries.push(s);
        seen.add(s.pdfName);
      }
    }
    res.json({ summaries });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summaries." });
  }
};

// GET /api/overall-summary - summarize all summaries using ML service and store in MultiSummary
const getOverallSummaryController = async (req, res) => {
  try {
    const summaries = await Summary.find(
      {},
      { summary: 1, pdfName: 1, _id: 0 }
    ).sort({ createdAt: 1 });
    if (!summaries.length)
      return res.json({ overallSummary: "No summaries available." });
    const mlServiceUrl = "https://casecrux.onrender.com/summarize_overall";
    const response = await axios.post(
      mlServiceUrl,
      { summaries },
      { timeout: 300000 }
    );
    let overallSummary = response.data.overall_summary || response.data;
    // Save to MultiSummary collection (history)
    const multiSummaryDoc = await MultiSummary.create({
      caseId: req.body?.caseId || `case-${Date.now()}`,
      summaries,
      finalSummary:
        typeof overallSummary === "string"
          ? overallSummary
          : JSON.stringify(overallSummary),
      pros: overallSummary.pros || [],
      cons: overallSummary.cons || [],
    });
    res.json({ overallSummary, multiSummaryId: multiSummaryDoc._id });
  } catch (error) {
    console.error(
      "Error in getOverallSummaryController:",
      error.message,
      error.response?.data
    );
    res.status(500).json({ error: "Failed to get overall summary." });
  }
};

// GET /api/overall-history - get all overall summaries (history)
const getOverallHistoryController = async (req, res) => {
  try {
    const history = await MultiSummary.find({}, { __v: 0 }).sort({
      createdAt: -1,
    });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overall summary history." });
  }
};

// GET /api/overall-summary/:id - get a specific overall summary by id
const getOverallSummaryByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MultiSummary.findById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overall summary." });
  }
};

// DELETE /api/summaries/:id - delete a summary by _id
const deleteSummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    await Summary.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete summary." });
  }
};

// DELETE /api/overall-summary/:id - delete an overall summary by _id
const deleteOverallSummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    await MultiSummary.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete overall summary." });
  }
};

module.exports = {
  summarizePdfController,
  getAllSummariesController,
  getOverallSummaryController,
  deleteSummaryController,
  upload, // Export multer instance for the route
  getOverallHistoryController,
  getOverallSummaryByIdController,
  deleteOverallSummaryController, // Export new controller
};
