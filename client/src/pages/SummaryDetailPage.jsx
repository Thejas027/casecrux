import React from "react";
import { useParams } from "react-router-dom";
import { useSummaryDetail } from "../hooks/useSummaryDetail";
import SummaryDisplay from "../components/features/summaryDetail/SummaryDisplay";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

const SummaryDetailPage = () => {
  const { id } = useParams();
  const { summary, loading, error, retry, clearError } = useSummaryDetail(id);

  // Maintain the overall page styling from the original SummaryDetail.jsx
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="max-w-3xl mx-auto">
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
        {!loading && !error && summary && <SummaryDisplay summary={summary} />}
        {!loading && !error && !summary && (
          <div className="text-center text-xl text-gray-400 py-10">
            Summary not found or still loading initial data.
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryDetailPage;
