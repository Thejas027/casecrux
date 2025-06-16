// controllers/multiDocumentController.js
const multiDocumentService = require("../services/multiDocumentService");
const { handleControllerError } = require("../utils/controllerUtils");

// @desc    Upload multiple PDFs and generate a combined summary and analysis
// @route   POST /api/summaries/multi-upload
// @access  Public
const uploadAndAnalyzeMultiplePdfs = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }
    const { caseId } = req.body;
    if (!caseId) {
      return res
        .status(400)
        .json({ message: "Case ID is required for multi-document upload." });
    }
    const files = req.files; // Array of files from multer

    const result = await multiDocumentService.processMultiplePdfs(
      files,
      caseId
    );
    res.status(201).json(result);
  } catch (error) {
    handleControllerError(
      error,
      next,
      "Failed to process multiple PDF documents"
    );
  }
};

module.exports = {
  uploadAndAnalyzeMultiplePdfs,
};
