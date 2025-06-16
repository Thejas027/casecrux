// services/individualSummaryService.js
const Summary = require("../models/Summary");
const { callMlService } = require("./mlService");
const { AppError } = require("../utils/errorUtils");

/**
 * Processes a single uploaded PDF, calls the ML service for summarization,
 * and saves or updates the summary in the database.
 * @param {Buffer} fileBuffer - The buffer of the uploaded PDF file.
 * @param {string} originalname - The original name of the PDF file.
 * @param {string} [caseId] - Optional case ID for the summary.
 * @returns {Promise<Summary>} The saved summary document.
 */
const processSinglePdf = async (fileBuffer, originalname, caseId) => {
  const effectiveCaseId =
    caseId || `default-case-${originalname}`.replace(/[^a-zA-Z0-9-_]/g, "_");

  try {
    const mlResponse = await callMlService(
      "/summarize",
      fileBuffer,
      originalname
    );
    // Ensure mlResponse and its nested properties are what you expect.
    // Example: { summary: { summary_text: '...', category: '...' } }
    // Adjust access based on actual ML service response structure.
    const summaryText = mlResponse.summary?.summary_text || mlResponse.summary;
    const category = mlResponse.summary?.category || mlResponse.category;

    if (!summaryText) {
      console.error(
        "ML service did not return a valid summary structure:",
        mlResponse
      );
      throw new AppError(
        "Failed to get a valid summary from the ML service.",
        500
      );
    }

    // Try to find an existing document by pdfName and caseId to update it
    let summaryDoc = await Summary.findOne({
      pdfName: originalname,
      caseId: effectiveCaseId,
    });

    if (summaryDoc) {
      summaryDoc.summary = summaryText;
      summaryDoc.category = category;
      summaryDoc.createdAt = Date.now(); // Update timestamp
    } else {
      summaryDoc = new Summary({
        caseId: effectiveCaseId,
        pdfName: originalname,
        summary: summaryText,
        category: category,
      });
    }
    await summaryDoc.save();
    return summaryDoc;
  } catch (error) {
    console.error(`Error in processSinglePdf for ${originalname}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Error processing PDF ${originalname}: ${error.message}`,
      error.status || 500,
      error.details
    );
  }
};

/**
 * Fetches all unique summaries, returning the latest version for each pdfName.
 * @returns {Promise<Summary[]>} An array of unique summary documents.
 */
const fetchAllUniqueSummaries = async () => {
  try {
    // This aggregation pipeline groups by pdfName and picks the latest summary for each.
    const uniqueSummaries = await Summary.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by creation date descending
      {
        $group: {
          _id: "$pdfName", // Group by pdfName
          latestSummary: { $first: "$$ROOT" }, // Get the first document in each group (which is the latest)
        },
      },
      { $replaceRoot: { newRoot: "$latestSummary" } }, // Promote the latestSummary to the root level
      { $sort: { createdAt: -1 } }, // Optional: sort the final list again if needed
    ]);
    return uniqueSummaries;
  } catch (error) {
    console.error("Error in fetchAllUniqueSummaries:", error);
    throw new AppError("Database error while fetching unique summaries.", 500);
  }
};

/**
 * Fetches an individual summary by its MongoDB ID.
 * @param {string} id - The ID of the summary.
 * @returns {Promise<Summary|null>} The summary document or null if not found.
 */
const fetchSummaryById = async (id) => {
  try {
    const summary = await Summary.findById(id);
    return summary;
  } catch (error) {
    console.error(`Error in fetchSummaryById for ID ${id}:`, error);
    throw new AppError(`Database error while fetching summary ID ${id}.`, 500);
  }
};

/**
 * Deletes an individual summary by its MongoDB ID.
 * @param {string} id - The ID of the summary to delete.
 * @returns {Promise<object|null>} The result of the deletion or null if not found.
 */
const removeSummaryById = async (id) => {
  try {
    const result = await Summary.findByIdAndDelete(id);
    return result;
  } catch (error) {
    console.error(`Error in removeSummaryById for ID ${id}:`, error);
    throw new AppError(`Database error while deleting summary ID ${id}.`, 500);
  }
};

module.exports = {
  processSinglePdf,
  fetchAllUniqueSummaries,
  fetchSummaryById,
  removeSummaryById,
};
