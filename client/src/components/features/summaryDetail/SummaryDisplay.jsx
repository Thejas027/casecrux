import React from "react";
import { Link } from "react-router-dom";
import Button from "../../common/Button"; // Assuming a common Button component exists

const SummaryDisplay = ({ summary }) => {
  if (!summary) return null;

  const summaryText =
    typeof summary.summary === "string"
      ? summary.summary
      : summary.summary?.output_text || JSON.stringify(summary.summary);

  const handleDownload = () => {
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.pdfName || summary._id}-summary.txt`;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex text-[#7f5af0]">
          <li>
            <Link to="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li>
            <span className="mx-2">&gt;</span>
          </li>
          <li className="text-[#2cb67d] font-semibold">
            Summary - {summary.pdfName || summary._id}
          </li>
        </ol>
      </nav>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-[#7f5af0]">
          {summary.pdfName || `Summary ID: ${summary._id}`}
        </h1>
        <Button onClick={handleDownload} variant="secondary" size="small">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 16 16"
            className="mr-2"
          >
            <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
          </svg>
          Download Summary
        </Button>
      </div>
      <pre className="whitespace-pre-wrap bg-[#18181b] p-6 rounded text-[#e0e7ef] border border-gray-700 text-lg leading-relaxed">
        {summaryText}
      </pre>
    </div>
  );
};

export default SummaryDisplay;
