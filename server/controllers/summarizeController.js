const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data"); // Added
const Summary = require("../models/Summary");

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
    if (summaryDoc) {
      // Update existing summary
      summaryDoc.summary = response.data.summary;
      summaryDoc.caseId = caseid || summaryDoc.caseId || "default-case";
      await summaryDoc.save();
    } else {
      summaryDoc = await Summary.create({
        caseId: caseid || "default-case",
        pdfName: req.file.originalname,
        summary: response.data.summary,
      });
    }
    res.json({
      _id: summaryDoc._id,
      pdfName: summaryDoc.pdfName,
      summary: summaryDoc.summary,
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

// GET /api/overall-summary - summarize all summaries using ML service
const getOverallSummaryController = async (req, res) => {
  try {
    const summaries = await Summary.find(
      {},
      { summary: 1, pdfName: 1, _id: 0 }
    ).sort({ createdAt: 1 });
    if (!summaries.length)
      return res.json({ overallSummary: "No summaries available." });
    // Call ML service with all summaries for overall summary, pros/cons, outcomes, acts used
    const mlServiceUrl = "https://casecrux.onrender.com/summarize_overall";
    const response = await axios.post(
      mlServiceUrl,
      { summaries },
      {
        timeout: 300000,
      }
    );
    // Try to parse structured response (JSON) if possible
    let overallSummary = response.data.overall_summary;
    let pros = null,
      cons = null,
      finalJudgment = null;
    // Try to extract sections if the LLM returns JSON
    if (typeof overallSummary === "object") {
      pros = overallSummary.pros || null;
      cons = overallSummary.cons || null;
      finalJudgment = overallSummary.finalJudgment || null;
      overallSummary = overallSummary.text || "";
    }
    res.json({ overallSummary, pros, cons, finalJudgment });
  } catch (error) {
    console.error(
      "Error in getOverallSummaryController:",
      error.message,
      error.response?.data
    );
    res.status(500).json({ error: "Failed to get overall summary." });
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

module.exports = {
  summarizePdfController,
  getAllSummariesController,
  getOverallSummaryController,
  deleteSummaryController,
  upload, // Export multer instance for the route
};
