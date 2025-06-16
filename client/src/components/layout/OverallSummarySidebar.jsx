import React from "react";
import { useNavigate } from "react-router-dom";
import { useOverallSummaryHistory } from "../../hooks/useOverallSummaryHistory";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import Button from "../common/Button"; // Assuming you have a common Button

const OverallSummaryHistoryList = () => {
  const {
    history,
    loading,
    error,
    deleteSummary,
    downloadAllPdfsForSummary,
    clearError,
    fetchHistory,
  } = useOverallSummaryHistory();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onClear={clearError}
        onRetry={fetchHistory}
      />
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-gray-400 text-center py-4">
        No overall summary history found.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {history.map((item) => (
        <li
          key={item._id}
          className="bg-[#18181b] rounded-lg shadow-md overflow-hidden border border-gray-700"
        >
          <div
            className="px-4 py-3 hover:bg-[#2a2f38] cursor-pointer transition-colors duration-150"
            onClick={() => navigate(`/overall-summary/${item._id}`)}
          >
            <h3 className="font-semibold text-lg text-[#7f5af0]">
              {item.caseId || item._id}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </p>
            {item.summaryCount && (
              <p className="text-xs text-gray-500 mt-1">
                Contains {item.summaryCount} document(s)
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 border-t border-gray-700">
            <Button
              variant="ghost"
              size="small"
              onClick={() => downloadAllPdfsForSummary(item._id, item.caseId)}
              className="text-green-400 hover:bg-green-900 hover:text-green-300 rounded-none border-r border-gray-700"
              title="Download all documents for this case"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mr-2"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
              </svg>
              Download Docs
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => deleteSummary(item._id)}
              className="text-red-400 hover:bg-red-900 hover:text-red-300 rounded-none"
              title="Delete this overall summary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mr-2"
              >
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zm2 .5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6z" />
                <path
                  fillRule="evenodd"
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3a.5.5 0 0 0-.5.5V4a.5.5 0 0 0 .5.5H13.5a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5h-11z"
                />
              </svg>
              Delete Case
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

const OverallSummarySidebar = () => {
  return (
    <aside className="w-full md:w-80 bg-[#23272f] border-r-2 border-[#7f5af0] min-h-screen p-4 flex flex-col shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-[#7f5af0] text-center">
        Case History
      </h2>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <OverallSummaryHistoryList />
      </div>
    </aside>
  );
};

export default OverallSummarySidebar;
