import React from "react";
import SummaryCard from "./SummaryCard";
import Button from "../../common/Button";
import { useNavigate } from "react-router-dom";

const SummariesList = ({ summaries, onDeleteSummary, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading && summaries.length === 0) {
    // Show a loader for the list if it's loading and empty,
    // otherwise, individual cards might show their own loading state or be disabled.
    // return <LoadingSpinner />;
  }

  if (!summaries || summaries.length === 0) {
    return (
      <p className="text-center text-[#e0e7ef] py-4">
        No summaries available yet. Upload a PDF to get started!
      </p>
    );
  }

  const handleDownloadSummary = (summaryContent, pdfName) => {
    const blob = new Blob([summaryContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfName || "summary"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8">
      <h2 className="text-3xl font-semibold text-[#7f5af0] mb-6">
        All Summaries
      </h2>
      <div className="space-y-6">
        {summaries.map((summary) => {
          const summaryTextToDownload =
            summary.summary?.summary ||
            summary.summary?.output_text ||
            (typeof summary.summary === "string"
              ? summary.summary
              : "Not available");

          return (
            <SummaryCard
              key={summary._id}
              summary={summary}
              onDelete={() => onDeleteSummary(summary._id)}
              onView={() => navigate(`/summary/${summary._id}`)}
              onDownload={() =>
                handleDownloadSummary(summaryTextToDownload, summary.pdfName)
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default SummariesList;
