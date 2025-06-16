import { useState, useEffect, useCallback } from "react";
import { getSummaryById } from "../services/api";

export const useSummaryDetail = (summaryId) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    if (!summaryId) return;

    setLoading(true);
    setError("");
    try {
      const data = await getSummaryById(summaryId);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setError(err.message || "Failed to fetch summary. Please try again.");
    }
    setLoading(false);
  }, [summaryId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    retry: fetchSummary, // Allow retrying the fetch
    clearError: () => setError(""),
  };
};
