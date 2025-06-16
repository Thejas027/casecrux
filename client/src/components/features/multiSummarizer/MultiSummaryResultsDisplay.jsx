import React from "react";

const MultiSummaryResultsDisplay = ({ results }) => {
  if (!results) return null;

  const { summaries, finalSummary, pros, cons, caseId } = results;

  return (
    <div className="mt-8 bg-gradient-to-br from-[#1e1b4b] via-[#23272f] to-[#18181b] text-white shadow-xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
      <h2 className="text-3xl font-bold text-[#7f5af0] mb-6 text-center">
        Multi-Document Case Analysis: {caseId}
      </h2>

      {finalSummary && (
        <div className="mb-8 p-6 bg-[#23272f] rounded-lg border border-gray-700">
          <h3 className="text-2xl font-semibold text-[#2cb67d] mb-3">
            Overall Final Summary
          </h3>
          <pre className="whitespace-pre-wrap text-gray-200 text-lg leading-relaxed">
            {finalSummary}
          </pre>
        </div>
      )}

      {(pros && pros.length > 0) || (cons && cons.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {pros && pros.length > 0 && (
            <div className="p-6 bg-green-900 bg-opacity-30 rounded-lg border border-green-700">
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
            <div className="p-6 bg-red-900 bg-opacity-30 rounded-lg border border-red-700">
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
      ) : null}

      {summaries && summaries.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-[#2cb67d] mb-4">
            Individual Document Summaries Included:
          </h3>
          <ul className="space-y-4">
            {summaries.map((s, idx) => (
              <li
                key={s.id || idx} // Prefer a stable ID if available from backend
                className="bg-[#23272f] rounded-lg p-4 shadow border border-gray-700"
              >
                <p className="font-bold text-[#7f5af0] text-lg mb-1">
                  {s.pdfName || s.fileName || `Document ${idx + 1}`}
                </p>
                <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                  {s.summaryText || s.summary || JSON.stringify(s)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSummaryResultsDisplay;
