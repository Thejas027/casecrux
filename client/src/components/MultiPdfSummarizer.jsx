import React, { useState } from "react";
import axios from "axios";
import { ButtonSpinner } from "./Spinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function MultiPdfSummarizer() {
  const [files, setFiles] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilesChange = (event) => {
    setFiles(Array.from(event.target.files));
    setResults(null);
    setError("");
  };

  const handleCaseIdChange = (event) => {
    setCaseId(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!caseId) {
      setError("Please enter a Case ID.");
      return;
    }
    if (!files.length) {
      setError("Please select at least one PDF file.");
      return;
    }
    setIsLoading(true);
    setError("");
    setResults(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("caseid", caseId);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/multi-summarize`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResults(response.data);
    } catch (err) {
      let errorMessage = "Failed to summarize PDFs. Please try again.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
        if (err.response.data.details) {
          errorMessage += ` Details: ${JSON.stringify(
            err.response.data.details
          )}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-white tracking-wider">
          Multi-PDF Case Summarizer
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]"
        >
          <div className="mb-6">
            <label
              className="block text-[#e0e7ef] text-lg font-bold mb-2"
              htmlFor="case-id"
            >
              Case ID:
            </label>
            <input
              id="case-id"
              type="text"
              value={caseId}
              onChange={handleCaseIdChange}
              placeholder="e.g. robbery-case-1"
              className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg w-full py-3 px-4 text-[#e0e7ef] placeholder-[#a786df] leading-tight focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] text-lg transition-all duration-150"
            />
          </div>
          <div className="mb-8">
            <label
              className="block text-[#e0e7ef] text-lg font-bold mb-2"
              htmlFor="pdfs"
            >
              Select PDF Files:
            </label>
            <input
              id="pdfs"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFilesChange}
              className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg w-full py-3 px-4 text-[#e0e7ef] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7f5af0] file:text-[#18181b] hover:file:bg-[#2cb67d] leading-tight focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] text-lg transition-all duration-150"
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={isLoading || !caseId || !files.length}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-300 transform hover:scale-105 ${
                isLoading || !caseId || !files.length
                  ? "opacity-50 cursor-not-allowed transform-none"
                  : ""
              }`}
            >
              {isLoading ? (
                <ButtonSpinner text="Summarizing..." />
              ) : (
                "Summarize All"
              )}
            </button>
          </div>
        </form>
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg relative mb-6 text-lg">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {results && (
          <div className="mt-8 bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
            <h2 className="text-3xl font-bold text-[#7f5af0] mb-8 text-center">
              Case Summary Results
            </h2>
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#2cb67d] mb-4">
                Individual Summaries:
              </h3>
              <div className="space-y-4">
                {results.summaries &&
                  results.summaries.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-[#18181b] rounded-lg p-6 shadow border border-[#7f5af0]"
                    >
                      <h4 className="font-bold text-[#7f5af0] text-lg mb-3">
                        {s.pdfName}:
                      </h4>
                      <pre className="whitespace-pre-wrap text-[#e0e7ef] leading-relaxed">
                        {typeof s.summary === "string"
                          ? s.summary
                          : s.summary.output_text || JSON.stringify(s.summary)}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#2cb67d] mb-4">
                Final Summary:
              </h3>
              <pre className="whitespace-pre-wrap bg-[#18181b] rounded-lg p-6 shadow text-[#e0e7ef] border border-[#7f5af0] leading-relaxed">
                {results.finalSummary}
              </pre>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#18181b] rounded-lg p-6 border border-[#2cb67d]/50">
                <h4 className="text-xl font-bold text-[#2cb67d] mb-4">Pros:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  {results.pros && results.pros.length > 0 ? (
                    results.pros.map((pro, i) => (
                      <li key={i} className="text-[#e0e7ef]">
                        {pro}
                      </li>
                    ))
                  ) : (
                    <li className="text-[#a786df]">No pros found.</li>
                  )}
                </ul>
              </div>
              <div className="bg-[#18181b] rounded-lg p-6 border border-red-500/50">
                <h4 className="text-xl font-bold text-red-400 mb-4">Cons:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  {results.cons && results.cons.length > 0 ? (
                    results.cons.map((con, i) => (
                      <li key={i} className="text-[#e0e7ef]">
                        {con}
                      </li>
                    ))
                  ) : (
                    <li className="text-[#a786df]">No cons found.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiPdfSummarizer;
