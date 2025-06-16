import { useState, useEffect, useCallback } from "react";
import {
  getOverallSummaryHistory as apiGetOverallSummaryHistory,
  deleteOverallSummary as apiDeleteOverallSummary,
  getOverallSummaryById as apiGetOverallSummaryById, // For downloading all related PDFs
} from "../services/api";

export const useOverallSummaryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetOverallSummaryHistory();
      // Ensure the response structure is correctly handled, e.g., response.data or response.data.history
      setHistory(response.data?.history || response.data || []);
    } catch (err) {
      console.error("Failed to fetch overall summary history:", err);
      setError(err.message || "Failed to fetch overall summary history.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteSummary = useCallback(async (summaryId) => {
    if (
      !window.confirm("Are you sure you want to delete this overall summary?")
    )
      return;
    try {
      await apiDeleteOverallSummary(summaryId);
      setHistory((prev) => prev.filter((item) => item._id !== summaryId));
    } catch (err) {
      console.error("Failed to delete overall summary:", err);
      // Potentially set an error message to display to the user
      alert(err.message || "Failed to delete overall summary.");
    }
  }, []);

  const downloadAllPdfsForSummary = useCallback(async (summaryId, caseName) => {
    try {
      const response = await apiGetOverallSummaryById(summaryId);
      const overallSummary = response.data; // Assuming API returns { data: summaryObject }

      if (!overallSummary.summaries || overallSummary.summaries.length === 0) {
        alert("No individual PDF summaries found for this overall case.");
        return;
      }

      let content = overallSummary.summaries
        .map((s, idx) => {
          const summaryText =
            typeof s.summary === "string"
              ? s.summary
              : s.summary?.output_text || JSON.stringify(s.summary, null, 2);
          return `Document: ${
            s.pdfName || s.fileName || `Summary ${idx + 1}`
          }\nCase ID: ${s.caseId || "N/A"}\n\n${summaryText}\n\n`;
        })
        .join("\n======================================\n\n");

      content =
        `Overall Case: ${
          overallSummary.caseId || caseName || summaryId
        }\nDate: ${new Date(
          overallSummary.createdAt
        ).toLocaleDateString()}\n\n` + content;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-documents-${
        overallSummary.caseId || caseName || summaryId
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download all PDFs for summary:", err);
      alert(err.message || "Failed to download PDF summaries.");
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory, // Expose to allow manual refresh if needed
    deleteSummary,
    downloadAllPdfsForSummary,
    clearError: () => setError(""),
  };
};
