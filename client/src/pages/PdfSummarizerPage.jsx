import { usePdfSummaries } from "../hooks/usePdfSummaries";
import PdfUploadForm from "../components/features/pdfSummarizer/PdfUploadForm";
import CurrentSummaryDisplay from "../components/features/pdfSummarizer/CurrentSummaryDisplay";
import SummariesList from "../components/features/pdfSummarizer/SummariesList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";

function PdfSummarizerPage() {
  const {
    file,
    currentSummary,
    allSummaries,
    overallSummaryResult,
    isLoading,
    error,
    handleFileChange,
    handleSubmitSinglePdf,
    handleDeleteSummary,
    handleCreateOverallSummary,
    clearError,
    // fetchAllSummaries, // Can be called if a manual refresh button is desired
  } = usePdfSummaries();

  // Optional: If you want a caseId for single uploads, manage it here or in the form
  // const [caseIdForSingle, setCaseIdForSingle] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-wider text-white">
            CaseCrux
          </h1>
          <p className="text-xl text-gray-300 mt-2">
            Upload, Summarize, and Analyze Your Legal Documents with Ease.
          </p>
        </header>

        {error && <ErrorMessage message={error} className="mb-6" />}

        <section id="single-pdf-summarizer" className="mb-12">
          <h2 className="text-3xl font-semibold text-[#7f5af0] mb-6 text-center">
            Summarize a Single PDF
          </h2>
          <PdfUploadForm
            file={file}
            onFileChange={handleFileChange}
            onSubmit={() => handleSubmitSinglePdf()} // Pass caseIdForSingle if using it
            isLoading={isLoading && !currentSummary && !overallSummaryResult} // More specific loading for this form
            // caseId={caseIdForSingle} // Pass if using
            // onCaseIdChange={setCaseIdForSingle} // Pass if using
          />
          {isLoading && !currentSummary && !error && (
            <LoadingSpinner className="mt-4" />
          )}
          {currentSummary && <CurrentSummaryDisplay summary={currentSummary} />}
        </section>

        <section id="overall-summary-creator" className="mb-12">
          <div className="text-center">
            <Button
              onClick={() => handleCreateOverallSummary()} // Add caseId input if needed for overall summary
              disabled={isLoading || allSummaries.length === 0}
              variant="secondary"
              className="py-3 px-8 text-lg"
            >
              {isLoading && overallSummaryResult === null
                ? "Generating Overall Summary..."
                : "Create Overall Summary"}
            </Button>
          </div>
          {isLoading && overallSummaryResult === null && !error && (
            <LoadingSpinner className="mt-4" />
          )}
          {overallSummaryResult && (
            <div className="mt-6 bg-[#23272f] shadow-md rounded-xl px-8 pt-6 pb-8 border border-[#7f5af0]">
              <h3 className="text-2xl font-semibold text-[#7f5af0] mb-3">
                Overall Case Analysis (ID:{" "}
                {overallSummaryResult.multiSummaryId ||
                  overallSummaryResult.caseId}
                )
              </h3>
              <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0] text-lg mb-4">
                {typeof overallSummaryResult.finalSummary === "string"
                  ? overallSummaryResult.finalSummary
                  : JSON.stringify(overallSummaryResult.finalSummary, null, 2)}
              </pre>
              {overallSummaryResult.pros &&
                overallSummaryResult.pros.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-semibold text-green-400">Pros:</h4>
                    <ul className="list-disc list-inside text-green-300">
                      {overallSummaryResult.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {overallSummaryResult.cons &&
                overallSummaryResult.cons.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-400">Cons:</h4>
                    <ul className="list-disc list-inside text-red-300">
                      {overallSummaryResult.cons.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </section>

        <SummariesList
          summaries={allSummaries}
          onDeleteSummary={handleDeleteSummary}
          isLoading={isLoading && allSummaries.length === 0} // Show general loading for the list only if it's initially loading
        />
      </div>
    </div>
  );
}

export default PdfSummarizerPage;
