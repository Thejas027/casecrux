import React, { useState } from "react";
import axios from "axios";

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
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-700 drop-shadow-lg">
        Multi-PDF Case Summarizer
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-6 border-2 border-indigo-200"
      >
        <div className="mb-6">
          <label
            className="block text-gray-700 text-lg font-bold mb-2"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-lg"
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-lg font-bold mb-2"
            htmlFor="pdfs"
          >
            Upload PDFs (up to 10):
          </label>
          <input
            id="pdfs"
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFilesChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-lg"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !caseId || !files.length}
            className={`bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 ${
              isLoading || !caseId || !files.length
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isLoading ? "Summarizing..." : "Summarize All"}
          </button>
        </div>
      </form>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-lg"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {results && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl rounded-xl px-10 pt-8 pb-10">
          <h2 className="text-2xl font-bold text-indigo-800 mb-6 text-center">
            Case Summary Results
          </h2>
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Individual Summaries:
            </h3>
            <ul className="list-disc pl-8 space-y-2">
              {results.summaries &&
                results.summaries.map((s, idx) => (
                  <li
                    key={idx}
                    className="bg-white rounded p-3 shadow border border-indigo-100"
                  >
                    <span className="font-bold text-indigo-600">
                      {s.pdfName}:
                    </span>
                    <pre className="whitespace-pre-wrap text-gray-800 mt-2">
                      {typeof s.summary === "string"
                        ? s.summary
                        : s.summary.output_text || JSON.stringify(s.summary)}
                    </pre>
                  </li>
                ))}
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Final Summary:
            </h3>
            <pre className="whitespace-pre-wrap bg-white rounded p-4 shadow text-gray-900 border border-indigo-100">
              {results.finalSummary}
            </pre>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-bold text-green-700 mb-2">Pros:</h4>
              <ul className="list-disc pl-6 space-y-1">
                {results.pros && results.pros.length > 0 ? (
                  results.pros.map((pro, i) => (
                    <li key={i} className="text-green-900">
                      {pro}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No pros found.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-red-700 mb-2">Cons:</h4>
              <ul className="list-disc pl-6 space-y-1">
                {results.cons && results.cons.length > 0 ? (
                  results.cons.map((con, i) => (
                    <li key={i} className="text-red-900">
                      {con}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No cons found.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiPdfSummarizer;
