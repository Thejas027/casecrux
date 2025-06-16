import { useState, useCallback } from "react";
import { uploadMultiplePdfs as apiUploadMultiplePdfs } from "../services/api";

export const useMultiPdfSummaries = () => {
  const [files, setFiles] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [results, setResults] = useState(null); // To store the response from multi-summary endpoint
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilesChange = useCallback((selectedFiles) => {
    setFiles(Array.from(selectedFiles));
    setResults(null);
    setError("");
  }, []);

  const handleCaseIdChange = useCallback((newCaseId) => {
    setCaseId(newCaseId);
  }, []);

  const handleSubmit = async () => {
    if (!caseId) {
      setError("Please enter a Case ID.");
      return;
    }
    if (!files.length) {
      setError("Please select at least one PDF file.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await apiUploadMultiplePdfs(files, caseId);
      setResults(response.data); // Assuming the API returns { summaries: [], finalSummary: '', pros: [], cons: [] }
      // Optionally clear files and caseId after successful submission
      // setFiles([]);
      // setCaseId('');
    } catch (err) {
      console.error("Failed to summarize multiple PDFs:", err);
      setError(
        err.message || "Failed to summarize multiple PDFs. Please try again."
      );
    }
    setIsLoading(false);
  };

  return {
    files,
    caseId,
    results,
    isLoading,
    error,
    handleFilesChange,
    handleCaseIdChange,
    handleSubmit,
    clearError: () => setError(""),
    clearResults: () => setResults(null),
  };
};
