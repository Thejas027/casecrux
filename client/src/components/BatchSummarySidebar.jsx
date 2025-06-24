import React from "react";
import PropTypes from "prop-types";

function BatchSummarySidebar({ summary, translatedSummary, selectedLanguage }) {
  // Helper function to check if the summary object has content
  const hasSummaryContent = (summaryObj) => {
    return summaryObj && (
      (summaryObj.pros && summaryObj.pros.length > 0) ||
      (summaryObj.cons && summaryObj.cons.length > 0) ||
      summaryObj.final_judgment ||
      summaryObj.raw
    );
  };

  // Format the date
  const formatDate = (date) => {
    return new Date(date || Date.now()).toLocaleString();
  };

  // Get language name from code
  const getLanguageName = (code) => {
    const languages = {
      en: "English",
      hi: "Hindi",
      kn: "Kannada",
      fr: "French",
      es: "Spanish",
      de: "German",
      ta: "Tamil",
      te: "Telugu",
      ml: "Malayalam",
      gu: "Gujarati",
      mr: "Marathi"
    };
    return languages[code] || code;
  };

  return (
    <aside className="w-72 bg-[#23272f] border-r-2 border-[#7f5af0] min-h-screen p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-[#7f5af0]">
        Current Batch Summary
      </h2>
      
      <div className="flex-1 overflow-y-auto">
        {/* Original Summary */}
        {hasSummaryContent(summary) ? (
          <div className="mb-6">
            <h3 className="text-[#2cb67d] font-bold mb-2">Original Summary</h3>
            <div className="bg-[#18181b] rounded-lg p-3 text-[#e0e7ef]">
              <span className="block text-xs text-gray-400 mb-2">
                {formatDate(summary?.createdAt)}
              </span>

              {summary.pros && summary.pros.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-[#7f5af0] mb-1">Pros:</h4>
                  <ul className="list-disc pl-4 text-sm space-y-1">
                    {summary.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.cons && summary.cons.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-[#7f5af0] mb-1">Cons:</h4>
                  <ul className="list-disc pl-4 text-sm space-y-1">
                    {summary.cons.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.final_judgment && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-[#7f5af0] mb-1">Final Judgment:</h4>
                  <p className="text-sm">{summary.final_judgment}</p>
                </div>
              )}

              {summary.raw && (
                <div className="mb-1">
                  <p className="text-sm whitespace-pre-line">{summary.raw}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[#e0e7ef] text-sm italic">
            No summary generated yet. Select PDFs and click "Summarize Selected" to generate a summary.
          </div>
        )}

        {/* Translated Summary */}
        {translatedSummary && (
          <div>
            <h3 className="text-[#2cb67d] font-bold mb-2 flex items-center">
              <span>Translated Summary</span>
              {selectedLanguage && (
                <span className="ml-2 text-xs bg-[#7f5af0] text-white rounded-full px-2 py-0.5">
                  {getLanguageName(selectedLanguage)}
                </span>
              )}
            </h3>
            <div className="bg-[#18181b] rounded-lg p-3 text-[#e0e7ef]">
              <span className="block text-xs text-gray-400 mb-2">
                {formatDate()}
              </span>
              <p className="text-sm whitespace-pre-line">{translatedSummary}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

BatchSummarySidebar.propTypes = {
  summary: PropTypes.object,
  translatedSummary: PropTypes.string,
  selectedLanguage: PropTypes.string
};

export default BatchSummarySidebar;
