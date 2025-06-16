// services/multiDocumentService.js
const MultiSummary = require("../models/MultiSummary"); // Assuming multi-doc summaries are stored in MultiSummary
const Summary = require("../models/Summary"); // For individual summaries if needed
const { callMlService } = require("./mlService");
const { AppError } = require("../utils/errorUtils");
const individualSummaryService = require("./individualSummaryService");

/**
 * Processes multiple uploaded PDF files, generates individual summaries,
 * then calls the ML service for a combined analysis (overall summary, pros, cons).
 * Saves the result as a MultiSummary document.
 * @param {Array<object>} files - Array of file objects from multer (each with buffer, originalname).
 * @param {string} caseId - The case ID for this multi-document summary.
 * @returns {Promise<MultiSummary>} The saved MultiSummary document containing the analysis.
 */
const processMultiplePdfs = async (files, caseId) => {
  if (!caseId) {
    throw new AppError(
      "Case ID is mandatory for multi-document processing.",
      400
    );
  }

  try {
    const individualSummariesData = [];
    // First, process each file to get an individual summary and save it.
    for (const file of files) {
      const { buffer, originalname } = file;
      // Use a specific caseId for these individual summaries, perhaps prefixed or suffixed by the main caseId
      const individualCaseId = `${caseId}_${originalname}`.replace(
        /[^a-zA-Z0-9-_]/g,
        "_"
      );

      const summaryDoc = await individualSummaryService.processSinglePdf(
        buffer,
        originalname,
        individualCaseId
      );
      individualSummariesData.push({
        pdfName: summaryDoc.pdfName,
        summary: summaryDoc.summary, // This is the text summary from ML service
        // category: summaryDoc.category, // if needed
        originalCaseId: summaryDoc.caseId, // The specific caseId used for this individual summary
        summaryDbId: summaryDoc._id, // ID of the saved individual summary document
      });
    }

    if (individualSummariesData.length === 0) {
      throw new AppError(
        "No PDF documents were successfully summarized individually.",
        400
      );
    }

    // Prepare payload for the /summarize_overall or a new /multi_analyze ML endpoint
    // This payload should contain the *text* of the individual summaries.
    const mlPayload = {
      summaries: individualSummariesData.map((s) => ({
        pdfName: s.pdfName,
        summary_text:
          typeof s.summary === "string"
            ? s.summary
            : s.summary?.summary_text || JSON.stringify(s.summary),
        // case_id: s.originalCaseId // Optionally pass original case_id if ML service uses it
      })),
      case_id: caseId, // The main case ID for the multi-document analysis
    };

    // Assuming the same ML endpoint can handle this, or a new one like /multi_analyze
    const mlResponse = await callMlService("/summarize_overall", mlPayload);
    const { overall_summary, pros, cons } = mlResponse; // Adjust based on actual ML response

    if (!overall_summary) {
      console.error(
        "ML service did not return a valid multi-document analysis structure:",
        mlResponse
      );
      throw new AppError(
        "Failed to get a valid analysis from the ML service for multiple documents.",
        500
      );
    }

    // Save the multi-document analysis result
    // The `summaries` field in MultiSummary should store references or key details of the individual summaries.
    const multiSummaryDoc = await MultiSummary.create({
      caseId,
      summaries: individualSummariesData.map((s) => ({
        pdfName: s.pdfName,
        summary: s.summary, // Storing the text summary here
        // originalCaseId: s.originalCaseId, // Optional
        // summaryDbId: s.summaryDbId // Optional reference to the Summary doc _id
      })),
      finalSummary:
        typeof overall_summary === "string"
          ? overall_summary
          : JSON.stringify(overall_summary),
      pros: pros || [],
      cons: cons || [],
    });

    return multiSummaryDoc;
  } catch (error) {
    console.error(`Error in processMultiplePdfs for case ${caseId}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error processing multiple PDFs for case ${caseId}: ${error.message}`,
      error.status || 500,
      error.details
    );
  }
};

module.exports = {
  processMultiplePdfs,
};
