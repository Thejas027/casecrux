import React from "react";
import { useParams } from "react-router-dom";
import { useOverallSummaryDetail } from "../hooks/useOverallSummaryDetail";
import OverallSummaryDisplay from "../components/features/overallSummary/OverallSummaryDisplay";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

const OverallSummaryPage = () => {
  const { id } = useParams(); // This 'id' is the overallSummaryId
  const { overallSummary, loading, error, retry, clearError } =
    useOverallSummaryDetail(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}
        {error && (
          <div className="my-8">
            <ErrorMessage
              message={error}
              onClear={clearError}
              onRetry={retry}
            />
          </div>
        )}
        {!loading && !error && overallSummary && (
          <OverallSummaryDisplay overallSummary={overallSummary} />
        )}
        {!loading && !error && !overallSummary && (
          <div className="text-center text-xl text-gray-400 py-10">
            Overall summary not found or still loading.
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallSummaryPage;
