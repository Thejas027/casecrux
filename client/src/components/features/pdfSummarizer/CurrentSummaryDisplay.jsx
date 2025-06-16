import React from "react";
import SummaryCard from "./SummaryCard"; // Assuming SummaryCard is in the same directory
import Button from "../../common/Button";

const CurrentSummaryDisplay = ({ summary, onDownload }) => {
  if (!summary) return null;

  const summaryText =
    summary.summary?.summary ||
    summary.summary?.output_text ||
    (typeof summary.summary === "string"
      ? summary.summary
      : "Processing failed or summary format not recognized.");

  const category = summary.summary?.category || summary.category;

  const handleDownload = () => {
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.pdfName || "current-summary"}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 bg-[#23272f] shadow-md rounded-xl px-8 pt-6 pb-8 border border-[#7f5af0]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold text-[#7f5af0]">
          Latest Summary: {summary.pdfName}
        </h2>
        <Button
          onClick={handleDownload}
          variant="outline"
          className="py-2 px-4 text-sm"
        >
          Download Summary
        </Button>
      </div>
      {category && (
        <p className="text-sm text-gray-400 mb-2">Category: {category}</p>
      )}
      <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0] text-lg">
        {summaryText}
      </pre>
    </div>
  );
};

export default CurrentSummaryDisplay;
