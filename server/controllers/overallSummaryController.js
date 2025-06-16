// controllers/overallSummaryController.js
const overallSummaryService = require("../services/overallSummaryService");
const { handleControllerError } = require("../utils/controllerUtils");

// @desc    Create or update an overall summary from existing individual summaries
// @route   POST /api/summaries/overall
// @access  Public
const generateOrUpdateOverallSummary = async (req, res, next) => {
  try {
    const { caseId } = req.body; // caseId can be optional, service can generate one
    const overallSummaryDoc =
      await overallSummaryService.generateOverallSummary(caseId);
    res.status(201).json(overallSummaryDoc);
  } catch (error) {
    handleControllerError(
      error,
      next,
      "Failed to generate or update overall summary"
    );
  }
};

// @desc    Get history of all overall summaries
// @route   GET /api/summaries/overall/history
// @access  Public
const getOverallSummaryHistoryList = async (req, res, next) => {
  try {
    const history = await overallSummaryService.fetchOverallSummaryHistory();
    res.json(history);
  } catch (error) {
    handleControllerError(
      error,
      next,
      "Failed to fetch overall summary history"
    );
  }
};

// @desc    Get a specific overall summary by its ID
// @route   GET /api/summaries/overall/:id
// @access  Public
const getOverallSummaryDetailsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await overallSummaryService.fetchOverallSummaryById(id);
    if (!doc) {
      return res.status(404).json({ message: "Overall summary not found." });
    }
    res.json(doc);
  } catch (error) {
    handleControllerError(error, next, "Failed to fetch overall summary by ID");
  }
};

// @desc    Delete an overall summary by its ID
// @route   DELETE /api/summaries/overall/:id
// @access  Public
const deleteOverallSummaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await overallSummaryService.removeOverallSummaryById(id);
    if (!result) {
      return res
        .status(404)
        .json({ message: "Overall summary not found for deletion." });
    }
    res.json({ message: "Overall summary deleted successfully." });
  } catch (error) {
    handleControllerError(error, next, "Failed to delete overall summary");
  }
};

module.exports = {
  generateOrUpdateOverallSummary,
  getOverallSummaryHistoryList,
  getOverallSummaryDetailsById,
  deleteOverallSummaryById,
};
