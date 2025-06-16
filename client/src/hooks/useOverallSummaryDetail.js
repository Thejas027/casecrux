import { useState, useEffect, useCallback } from "react";
import { getOverallSummaryById } from "../services/api"; // Assuming this function exists in api.js

export const useOverallSummaryDetail = (overallSummaryId) => {
  const [overallSummary, setOverallSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverallSummary = useCallback(async () => {
    if (!overallSummaryId) {
      // setError('No Overall Summary ID provided.'); // Optional: set error if ID is missing
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await getOverallSummaryById(overallSummaryId);
      setOverallSummary(response.data); // Assuming API returns { data: summaryObject }
    } catch (err) {
      console.error("Failed to fetch overall summary:", err);
      setError(
        err.message || "Failed to fetch overall summary. Please try again."
      );
    }
    setLoading(false);
  }, [overallSummaryId]);

  useEffect(() => {
    fetchOverallSummary();
  }, [fetchOverallSummary]);

  return {
    overallSummary,
    loading,
    error,
    retry: fetchOverallSummary,
    clearError: () => setError(""),
  };
};
