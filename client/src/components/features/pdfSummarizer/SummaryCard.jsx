import React from "react";
import Button from "../../common/Button";

const SummaryCard = ({ summary, onDelete, onView, onDownload }) => {
  if (!summary) return null;

  const summaryText =
    summary.summary?.summary ||
    summary.summary?.output_text ||
    (typeof summary.summary === "string"
      ? summary.summary
      : "Summary not available");
  const category = summary.summary?.category || summary.category || "N/A";

  return (
    <div className="bg-[#23272f] shadow-md rounded-xl p-6 border border-[#7f5af0] mb-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-semibold text-[#7f5af0]">
            {summary.pdfName}
          </h3>
          {category && (
            <p className="text-sm text-gray-400">Category: {category}</p>
          )}
        </div>
        <div className="flex space-x-2">
          {onDownload && (
            <Button
              onClick={onDownload}
              variant="outline"
              className="py-2 px-3 text-sm"
            >
              Download
            </Button>
          )}
          {onView && (
            <Button
              onClick={onView}
              variant="outline"
              className="py-2 px-3 text-sm"
            >
              View Details
            </Button>
          )}
        </div>
      </div>
      <div className="prose prose-invert max-w-none text-[#e0e7ef] mb-4">
        <p className="line-clamp-3">{summaryText}</p>
      </div>
      {onDelete && (
        <Button
          onClick={onDelete}
          variant="danger"
          className="py-2 px-4 text-sm"
        >
          Delete
        </Button>
      )}
    </div>
  );
};

export default SummaryCard;
