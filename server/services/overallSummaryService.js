// services/overallSummaryService.js
const Summary = require("../models/Summary");
const MultiSummary = require("../models/MultiSummary");
const { callMlService } = require("./mlService");
const { AppError } = require("../utils/errorUtils");

/**
 * Generates or updates an overall summary for a given caseId.
 * If no caseId is provided, a new one is generated.
 * It fetches relevant individual summaries, calls the ML service for an overall summary,
 * and saves or updates the MultiSummary document.
 * @param {string} [caseId] - Optional case ID.
 * @returns {Promise<MultiSummary>} The saved MultiSummary document.
 */
const generateOverallSummary = async (caseId) => {
  const effectiveCaseId = caseId || `overall-case-${Date.now()}`;

  try {
    // Fetch individual summaries. Adjust filter as needed (e.g., by caseId if applicable, or all)
    const individualSummaries = await Summary.find(
      {
        caseId: {
          $regex: effectiveCaseId.startsWith("overall-case-")
            ? ".*"
            : `^${effectiveCaseId}$`,
        },
      }, // crude way to get all if it's a new overall case
      { pdfName: 1, summary: 1, caseId: 1, _id: 0 } // Select necessary fields
    ).sort({ createdAt: 1 });

    if (!individualSummaries.length) {
      throw new AppError(
        "No individual summaries found to generate an overall summary.",
        404
      );
    }

    // Prepare data for ML service (ensure it matches what the ML service expects)
    const mlPayload = {
      summaries: individualSummaries.map((s) => ({
        pdfName: s.pdfName,
        // Ensure s.summary is the text content. If it can be an object, extract text part.
        summary_text:
          typeof s.summary === "string"
            ? s.summary
            : s.summary?.summary_text || JSON.stringify(s.summary),
        case_id: s.caseId,
      })),
      case_id: effectiveCaseId, // Pass the overall case ID
    };

    const mlResponse = await callMlService("/summarize_overall", mlPayload);
    const { overall_summary, pros, cons } = mlResponse; // Adjust based on actual ML response

    if (!overall_summary) {
      console.error(
        "ML service did not return a valid overall summary structure:",
        mlResponse
      );
      throw new AppError(
        "Failed to get a valid overall summary from the ML service.",
        500
      );
    }

    let multiSummaryDoc = await MultiSummary.findOne({
      caseId: effectiveCaseId,
    });

    const mappedSummaries = individualSummaries.map((s) => ({
      pdfName: s.pdfName,
      summary: s.summary, // Store the original summary structure from individual docs
      // caseId: s.caseId, // Optionally store original caseId if different
    }));

    if (multiSummaryDoc) {
      multiSummaryDoc.summaries = mappedSummaries;
      multiSummaryDoc.finalSummary =
        typeof overall_summary === "string"
          ? overall_summary
          : JSON.stringify(overall_summary);
      multiSummaryDoc.pros = pros || [];
      multiSummaryDoc.cons = cons || [];
      multiSummaryDoc.createdAt = Date.now(); // Update timestamp
    } else {
      multiSummaryDoc = new MultiSummary({
        caseId: effectiveCaseId,
        summaries: mappedSummaries,
        finalSummary:
          typeof overall_summary === "string"
            ? overall_summary
            : JSON.stringify(overall_summary),
        pros: pros || [],
        cons: cons || [],
      });
    }
    await multiSummaryDoc.save();
    return multiSummaryDoc;
  } catch (error) {
    console.error(
      `Error in generateOverallSummary for case ${effectiveCaseId}:`,
      error
    );
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error generating overall summary for case ${effectiveCaseId}: ${error.message}`,
      error.status || 500,
      error.details
    );
  }
};

/**
 * Fetches the history of all overall summaries, sorted by creation date.
 * @returns {Promise<MultiSummary[]>} An array of MultiSummary documents.
 */
const fetchOverallSummaryHistory = async () => {
  try {
    const history = await MultiSummary.find().sort({ createdAt: -1 });
    return history;
  } catch (error) {
    console.error("Error in fetchOverallSummaryHistory:", error);
    throw new AppError(
      "Database error while fetching overall summary history.",
      500
    );
  }
};

/**
 * Fetches a specific overall summary by its MongoDB ID.
 * @param {string} id - The ID of the MultiSummary document.
 * @returns {Promise<MultiSummary|null>} The document or null if not found.
 */
const fetchOverallSummaryById = async (id) => {
  try {
    const doc = await MultiSummary.findById(id);
    return doc;
  } catch (error) {
    console.error(`Error in fetchOverallSummaryById for ID ${id}:`, error);
    throw new AppError(
      `Database error while fetching overall summary ID ${id}.`,
      500
    );
  }
};

/**
 * Deletes an overall summary by its MongoDB ID.
 * @param {string} id - The ID of the MultiSummary to delete.
 * @returns {Promise<object|null>} The result of the deletion or null if not found.
 */
const removeOverallSummaryById = async (id) => {
  try {
    const result = await MultiSummary.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error(`Error in removeOverallSummaryById for ID ${id}:`, error);
    throw new AppError(
      `Database error while deleting overall summary ID ${id}.`,
      500
    );
  }
};

module.exports = {
  generateOverallSummary,
  fetchOverallSummaryHistory,
  fetchOverallSummaryById,
  removeOverallSummaryById,
};
