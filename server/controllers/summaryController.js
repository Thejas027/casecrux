const Summary = require("../models/Summary");
const MultiSummary = require("../models/MultiSummary");
const { callMlService } = require("../services/mlService");

// @desc    Summarize a single PDF
// @route   POST /api/summaries/upload
// @access  Public
const summarizePdf = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const { caseId } = req.body;
    const { buffer, originalname } = req.file;

    const mlResponse = await callMlService("/summarize", buffer, originalname);

    let summaryDoc = await Summary.findOne({
      pdfName: originalname,
      caseId: caseId || "default-case",
    });

    const summaryData = mlResponse.summary; // Assuming mlResponse is { summary: { summary: 'text', category: 'cat'} }
    const category = mlResponse.category; // Or however the category is structured

    if (summaryDoc) {
      summaryDoc.summary = summaryData;
      summaryDoc.category = category;
      // summaryDoc.caseId will remain as it was, or use new caseId if provided and different logic is needed
      await summaryDoc.save();
    } else {
      summaryDoc = await Summary.create({
        caseId: caseId || "default-case",
        pdfName: originalname,
        summary: summaryData,
        category: category,
      });
    }
    res.status(201).json(summaryDoc);
  } catch (error) {
    next(error); // Pass error to central error handler
  }
};

// @desc    Get all unique summaries (latest for each pdfName)
// @route   GET /api/summaries
// @access  Public
const getAllUniqueSummaries = async (req, res, next) => {
  try {
    const allSummaries = await Summary.find().sort({ createdAt: -1 });
    const uniqueSummaries = [];
    const seenPdfNames = new Set();

    for (const summary of allSummaries) {
      if (!seenPdfNames.has(summary.pdfName)) {
        uniqueSummaries.push(summary);
        seenPdfNames.add(summary.pdfName);
      }
    }
    res.json(uniqueSummaries);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update an overall summary from existing individual summaries
// @route   POST /api/summaries/overall
// @access  Public
const createOrUpdateOverallSummary = async (req, res, next) => {
  try {
    const { caseId = `case-${Date.now()}` } = req.body; // Default caseId if not provided
    const individualSummaries = await Summary.find(
      {},
      { summary: 1, pdfName: 1, _id: 0 }
    ).sort({ createdAt: 1 });

    if (!individualSummaries.length) {
      return res
        .status(404)
        .json({
          message:
            "No individual summaries available to create an overall summary.",
        });
    }

    const mlResponse = await callMlService("/summarize_overall", {
      summaries: individualSummaries,
    });
    const { overall_summary, pros, cons } = mlResponse; // Assuming this structure from ML service

    let multiSummaryDoc = await MultiSummary.findOne({ caseId });

    if (multiSummaryDoc) {
      multiSummaryDoc.summaries = individualSummaries;
      multiSummaryDoc.finalSummary =
        typeof overall_summary === "string"
          ? overall_summary
          : JSON.stringify(overall_summary);
      multiSummaryDoc.pros = pros || [];
      multiSummaryDoc.cons = cons || [];
      multiSummaryDoc.createdAt = Date.now(); // Update timestamp
      await multiSummaryDoc.save();
    } else {
      multiSummaryDoc = await MultiSummary.create({
        caseId,
        summaries: individualSummaries,
        finalSummary:
          typeof overall_summary === "string"
            ? overall_summary
            : JSON.stringify(overall_summary),
        pros: pros || [],
        cons: cons || [],
      });
    }
    res.status(201).json(multiSummaryDoc);
  } catch (error) {
    next(error);
  }
};

// @desc    Get history of all overall summaries
// @route   GET /api/summaries/overall/history
// @access  Public
const getOverallSummaryHistory = async (req, res, next) => {
  try {
    const history = await MultiSummary.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific overall summary by its ID
// @route   GET /api/summaries/overall/:id
// @access  Public
const getOverallSummaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await MultiSummary.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Overall summary not found." });
    }
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an individual summary by its ID
// @route   DELETE /api/summaries/:id
// @access  Public
const deleteIndividualSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Summary.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Individual summary not found." });
    }
    res.json({ message: "Individual summary deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an overall summary by its ID
// @route   DELETE /api/summaries/overall/:id
// @access  Public
const deleteOverallSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await MultiSummary.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Overall summary not found." });
    }
    res.json({ message: "Overall summary deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summarizePdf,
  getAllUniqueSummaries,
  createOrUpdateOverallSummary,
  getOverallSummaryHistory,
  getOverallSummaryById,
  deleteIndividualSummary,
  deleteOverallSummary,
};
