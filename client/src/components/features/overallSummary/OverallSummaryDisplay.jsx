import React from "react";
import { Link } from "react-router-dom";
import Button from "../../common/Button"; // Assuming a common Button component

const OverallSummaryDisplay = ({ overallSummary }) => {
  if (!overallSummary) return null;

  const { caseId, finalSummary, pros, cons, _id } = overallSummary;

  const handleDownload = () => {
    const contentToDownload =
      finalSummary || JSON.stringify(overallSummary, null, 2);
    const blob = new Blob([contentToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overall-summary-${caseId || _id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#23272f] shadow-2xl rounded-xl px-8 sm:px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
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
            Overall Summary - {caseId || _id}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-extrabold text-[#7f5af0] mb-3 sm:mb-0">
          Case Analysis: {caseId || _id}
        </h1>
        <Button onClick={handleDownload} variant="primary" size="medium">
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
          Download Analysis
        </Button>
      </div>

      {finalSummary && (
        <div className="mb-8 p-6 bg-[#18181b] rounded-lg border border-gray-700">
          <h3 className="text-2xl font-semibold text-[#2cb67d] mb-3">
            Comprehensive Summary
          </h3>
          <pre className="whitespace-pre-wrap text-gray-200 text-lg leading-relaxed">
            {finalSummary}
          </pre>
        </div>
      )}

      {(pros && pros.length > 0) || (cons && cons.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {pros && pros.length > 0 && (
            <div className="p-6 bg-green-900 bg-opacity-40 rounded-lg border border-green-700">
              <h4 className="text-xl font-bold text-green-400 mb-3">
                Strengths / Pros:
              </h4>
              <ul className="list-disc pl-6 space-y-2 text-green-200">
                {pros.map((pro, i) => (
                  <li key={`pro-${i}`}>{pro}</li>
                ))}
              </ul>
            </div>
          )}
          {cons && cons.length > 0 && (
            <div className="p-6 bg-red-900 bg-opacity-40 rounded-lg border border-red-700">
              <h4 className="text-xl font-bold text-red-400 mb-3">
                Weaknesses / Cons:
              </h4>
              <ul className="list-disc pl-6 space-y-2 text-red-200">
                {cons.map((con, i) => (
                  <li key={`con-${i}`}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !finalSummary && (
          <p className="text-gray-400 text-center py-4">
            No detailed analysis (pros/cons) available.
          </p>
        )
      )}

      {!finalSummary &&
        (!pros || pros.length === 0) &&
        (!cons || cons.length === 0) && (
          <p className="text-gray-400 text-center py-10 text-lg">
            No summary content found for this case.
          </p>
        )}
    </div>
  );
};

export default OverallSummaryDisplay;
