import { useState, useEffect, useCallback } from "react";
import {
  uploadPdf as apiUploadPdf,
  getAllUniqueSummaries as apiGetAllUniqueSummaries,
  deleteIndividualSummary as apiDeleteIndividualSummary,
  createOrUpdateOverallSummary as apiCreateOrUpdateOverallSummary,
} from "../services/api"; // Adjust path as necessary

export const usePdfSummaries = () => {
  const [file, setFile] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null); // Stores the latest single summary object { _id, pdfName, summary, category }
  const [allSummaries, setAllSummaries] = useState([]); // List of all individual summaries
  const [overallSummaryResult, setOverallSummaryResult] = useState(null); // Result of overall summarization
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAllSummaries = useCallback(async () => {
    try {
      setError("");
      // setIsLoading(true); // Optional: set loading for fetching all summaries
      const response = await apiGetAllUniqueSummaries();
      setAllSummaries(response.data || []);
    } catch (err) {
      console.error("Failed to fetch summaries:", err);
      setError(err.message || "Failed to fetch summaries.");
      setAllSummaries([]); // Clear on error or set to empty
    }
    // finally {
    //   setIsLoading(false);
    // }
  }, []);

  useEffect(() => {
    fetchAllSummaries();
  }, [fetchAllSummaries]);

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    setCurrentSummary(null); // Clear previous single summary
    setError("");
  };

  const handleSubmitSinglePdf = async (caseId) => {
    if (!file) {
      setError("Please select a PDF file to summarize.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCurrentSummary(null);

    try {
      const response = await apiUploadPdf(file, caseId); // Pass caseId if available
      setCurrentSummary(response.data); // Assuming API returns the new summary object
      setFile(null); // Clear file input
      await fetchAllSummaries(); // Refresh the list of all summaries
    } catch (err) {
      console.error("Failed to summarize PDF:", err);
      setError(err.message || "Failed to summarize PDF. Please try again.");
    }
    setIsLoading(false);
  };

  const handleDeleteSummary = async (summaryId) => {
    if (!window.confirm("Are you sure you want to delete this summary?")) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await apiDeleteIndividualSummary(summaryId);
      setAllSummaries((prev) => prev.filter((s) => s._id !== summaryId));
      if (currentSummary && currentSummary._id === summaryId) {
        setCurrentSummary(null); // Clear if the deleted one was the current
      }
      // If you want to clear overall summary if a component is deleted, add logic here
    } catch (err) {
      console.error("Failed to delete summary:", err);
      setError(err.message || "Failed to delete summary. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCreateOverallSummary = async (caseId) => {
    setIsLoading(true);
    setError("");
    setOverallSummaryResult(null);
    try {
      const response = await apiCreateOrUpdateOverallSummary(caseId);
      setOverallSummaryResult(response.data); // Store the full overall summary object
      // Optionally, you might want to refresh overall summary history if displayed elsewhere
    } catch (err) {
      console.error("Failed to create overall summary:", err);
      setError(err.message || "Failed to create overall summary.");
    }
    setIsLoading(false);
  };

  return {
    file,
    currentSummary,
    allSummaries,
    overallSummaryResult,
    isLoading,
    error,
    handleFileChange,
    handleSubmitSinglePdf,
    handleDeleteSummary,
    handleCreateOverallSummary,
    fetchAllSummaries, // Expose if manual refresh is needed
    clearError: () => setError(""),
    clearCurrentSummary: () => setCurrentSummary(null),
    clearOverallSummaryResult: () => setOverallSummaryResult(null),
  };
};
