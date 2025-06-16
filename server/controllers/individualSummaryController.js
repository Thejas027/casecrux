// controllers/individualSummaryController.js
const individualSummaryService = require("../services/individualSummaryService");
const { handleControllerError } = require("../utils/controllerUtils");

// @desc    Upload and summarize a single PDF
// @route   POST /api/summaries/upload
// @access  Public
const uploadAndSummarizePdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const { caseId } = req.body;
    const { buffer, originalname } = req.file;
    const summaryDoc = await individualSummaryService.processSinglePdf(
      buffer,
      originalname,
      caseId
    );
    res.status(201).json(summaryDoc);
  } catch (error) {
    handleControllerError(error, next, "Failed to upload and summarize PDF");
  }
};

// @desc    Get all unique summaries (latest for each pdfName)
// @route   GET /api/summaries
// @access  Public
const getAllUniqueIndividualSummaries = async (req, res, next) => {
  try {
    const uniqueSummaries =
      await individualSummaryService.fetchAllUniqueSummaries();
    res.json(uniqueSummaries);
  } catch (error) {
    handleControllerError(error, next, "Failed to fetch unique summaries");
  }
};

// @desc    Get an individual summary by its ID
// @route   GET /api/summaries/:id
// @access  Public
const getIndividualSummaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await individualSummaryService.fetchSummaryById(id);
    if (!summary) {
      return res.status(404).json({ message: "Individual summary not found." });
    }
    res.json(summary);
  } catch (error) {
    handleControllerError(error, next, "Failed to fetch summary by ID");
  }
};

// @desc    Delete an individual summary by its ID
// @route   DELETE /api/summaries/:id
// @access  Public
const deleteIndividualSummaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await individualSummaryService.removeSummaryById(id);
    if (!result) {
      return res
        .status(404)
        .json({ message: "Individual summary not found for deletion." });
    }
    res.json({ message: "Individual summary deleted successfully." });
  } catch (error) {
    handleControllerError(error, next, "Failed to delete individual summary");
  }
};

module.exports = {
  uploadAndSummarizePdf,
  getAllUniqueIndividualSummaries,
  getIndividualSummaryById,
  deleteIndividualSummaryById,
};
