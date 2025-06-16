import React from "react";
import { useMultiPdfSummaries } from "../../../hooks/useMultiPdfSummaries";
import MultiPdfUploadForm from "./MultiPdfUploadForm";
import MultiSummaryResultsDisplay from "./MultiSummaryResultsDisplay";
import LoadingSpinner from "../../common/LoadingSpinner";
import ErrorMessage from "../../common/ErrorMessage";

const MultiPdfSummarizerView = () => {
  const {
    files,
    caseId,
    results,
    isLoading,
    error,
    handleFilesChange,
    handleCaseIdChange,
    handleSubmit,
    clearError,
    // clearResults, // Not used currently, but available
  } = useMultiPdfSummaries();

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen text-white">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-[#7f5af0]">
          Multi-Document Case Analyzer
        </h1>
        <p className="text-xl text-gray-400 mt-4">
          Upload multiple PDF documents for a comprehensive case analysis,
          including individual summaries, an overall summary, and identified
          strengths & weaknesses.
        </p>
      </header>

      <MultiPdfUploadForm
        files={files}
        caseId={caseId}
        onFilesChange={handleFilesChange}
        onCaseIdChange={handleCaseIdChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="flex justify-center mt-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="mt-8">
          <ErrorMessage message={error} onClear={clearError} />
        </div>
      )}

      {results && !isLoading && (
        <div className="mt-12">
          <MultiSummaryResultsDisplay results={results} />
        </div>
      )}
    </div>
  );
};

export default MultiPdfSummarizerView;
