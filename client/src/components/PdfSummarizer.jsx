import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ButtonSpinner, InlineSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function PdfSummarizer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [allSummaries, setAllSummaries] = useState([]);
  const [overallSummary, setOverallSummary] = useState("");
  const [fetchingOverallSummary, setFetchingOverallSummary] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // Fetch all summaries from backend on mount
  useEffect(() => {
    fetchSummaries();
  }, []);

  // Debug: Track overallSummary state changes
  useEffect(() => {
    console.log("🔍 overallSummary state changed:", {
      length: overallSummary?.length || 0,
      type: typeof overallSummary,
      hasContent: !!overallSummary,
      preview: overallSummary?.substring?.(0, 100) || 'N/A'
    });
  }, [overallSummary]);

  const fetchSummaries = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/summaries`);
      setAllSummaries(res.data.summaries || []);
    } catch (err) {
      // ignore fetch error
      console.log("Failed to fetch summaries:", err.message);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setSummary("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a PDF file to summarize.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSummary("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/summarize`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      let summaryText = "";
      if (
        response.data &&
        response.data.summary &&
        typeof response.data.summary.output_text === "string"
      ) {
        summaryText = response.data.summary.output_text;
      } else if (response.data && typeof response.data.summary === "string") {
        summaryText = response.data.summary;
      } else if (response.data && typeof response.data.summary === "object") {
        summaryText =
          response.data.summary.summary ||
          response.data.summary.output_text ||
          "";
      } else {
        setError(
          "Failed to parse summary from the server response. Expected 'response.data.summary.output_text' to be a string."
        );
        setSummary("");
        setIsLoading(false);
        return;
      }
      setSummary(summaryText);
      setFile(null);
      await fetchSummaries();
    } catch (err) {
      let errorMessage = "Failed to summarize PDF. Please try again.";
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

  // Request overall summary from backend
  const handleOverallSummary = async () => {
    setFetchingOverallSummary(true);
    setOverallSummary("");
    setError("");
    try {
      const res = await axios.get(`${BACKEND_URL}/api/overall-summary`);
      console.log("✅ Overall summary response:", res);
      console.log("✅ Overall summary data:", res.data);
      console.log("✅ overallSummary field:", res.data.overallSummary);
      console.log("✅ Type of overallSummary:", typeof res.data.overallSummary);
      
      const summaryText = res.data.overallSummary || "";
      setOverallSummary(summaryText);
      
      // Also refresh the summaries list to update any history/sidebar
      await fetchSummaries();
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        if (!summaryText) {
          console.warn("⚠️ Overall summary is empty after successful response");
          setError("Received empty overall summary from server.");
        }
      }, 100);
    } catch (err) {
      setError("Failed to get overall summary.");
      console.error("Error fetching overall summary:", err.message);
      console.error("Error response:", err.response?.data);
    } finally {
      setFetchingOverallSummary(false);
    }
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this summary?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await axios.delete(`${BACKEND_URL}/api/summaries/${id}`);
      setAllSummaries((prev) => prev.filter((s) => s._id !== id));
      setSummary("");
      setOverallSummary("");
      setError("");
    } catch (err) {
      setError("Failed to delete summary. Please try again.");
      console.error("Error deleting summary:", err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-5xl font-extrabold text-center mb-8 tracking-wider"
          style={{
            color: "#ffffff",
          }}
        >
          CaseCrux
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]"
        >
          <div className="mb-6">
            <label
              htmlFor="pdf-upload"
              className="block text-[#7f5af0] text-lg font-bold mb-2"
            >
              Upload PDF:
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#18181b] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0] text-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading || !file}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                isLoading || !file ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading && <ButtonSpinner />}
              {isLoading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </form>
        {error && (
          <div
            className="bg-[#2cb67d] border border-[#7f5af0] text-[#18181b] px-4 py-3 rounded relative mb-4 text-lg"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {summary && (
          <div className="mt-6 bg-[#23272f] shadow-md rounded-xl px-8 pt-6 pb-8 border border-[#7f5af0]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-semibold text-[#7f5af0] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                </svg>
                Latest Summary
              </h2>
              <button
                onClick={() => {
                  const blob = new Blob([summary], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "pdf-summary.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Download PDF Summary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                </svg>
                Download Summary
              </button>
            </div>
            {/* Enhanced Summary Display */}
            <div className="bg-[#18181b] p-6 rounded-lg border border-[#7f5af0]">
              {typeof summary === "string" ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-[#7f5af0] mb-4 border-b border-[#7f5af0]/30 pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-[#2cb67d] mb-3 mt-6">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-[#e0e7ef] mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-[#e0e7ef] mb-4 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-[#e0e7ef]">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-[#e0e7ef] mb-1">
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-[#2cb67d] font-semibold">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-[#7f5af0] italic">
                          {children}
                        </em>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#7f5af0] pl-4 italic text-[#a786df] mb-4">
                          {children}
                        </blockquote>
                      ),
                      hr: () => (
                        <hr className="border-[#7f5af0]/30 my-6" />
                      ),
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-[#e0e7ef] leading-relaxed">
                  {summary}
                </pre>
              )}
            </div>

            {/* Translation Section */}
            <TranslationSection 
              textToTranslate={summary}
              title="Summary Translation"
              className="mt-6"
              onError={(errorMsg) => setError(errorMsg)}
            />
          </div>
        )}
        {/* Flat list of all summaries, no category grouping */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: "#7f5af0" }}>
              All Summaries
            </h2>
          </div>
          {allSummaries.length === 0 ? (
            <div className="text-lg text-[#a786df]">No summaries yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {allSummaries.map((s, idx) => {
                const summaryText =
                  typeof s.summary === "string"
                    ? s.summary
                    : s.summary.output_text || 'No summary available';
                const preview =
                  summaryText.length > 180
                    ? summaryText.slice(0, 180) + "..."
                    : summaryText;
                return (
                  <div
                    key={s._id}
                    className="bg-gradient-to-br from-[#23272f] to-[#18181b] shadow-lg rounded-lg p-4 border-2 flex flex-col justify-between"
                    style={{
                      borderColor: idx % 2 === 0 ? "#7f5af0" : "#2cb67d",
                    }}
                  >
                    <div>
                      <span
                        className="font-semibold text-lg truncate"
                        title={s.pdfName}
                        style={{ color: idx % 2 === 0 ? "#7f5af0" : "#2cb67d" }}
                      >
                        {s.pdfName}
                      </span>
                      <div className="text-[#e0e7ef] text-sm whitespace-pre-wrap mt-2">
                        {preview}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => navigate(`/summary/${s._id}`)}
                        className="text-xs bg-[#7f5af0] hover:bg-[#4b267f] text-white px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon transition-colors duration-150 cursor-pointer"
                      >
                        Show
                      </button>
                      <button
                        onClick={() => handleDeleteSummary(s._id)}
                        disabled={deletingId === s._id}
                        className={`text-xs bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon transition-colors duration-150 cursor-pointer flex items-center gap-1 ${
                          deletingId === s._id ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {deletingId === s._id && <ButtonSpinner size="small" />}
                        {deletingId === s._id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        title="Download PDF Summary"
                        className="text-xs bg-[#23272f] border border-[#7f5af0] text-[#7f5af0] px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon flex items-center group transition-colors duration-150 cursor-pointer"
                        onClick={() => {
                          const blob = new Blob(
                            [
                              typeof s.summary === "string"
                                ? s.summary
                                : s.summary.output_text ||
                                  (s.summary.output_text || 'No summary available'),
                            ],
                            { type: "text/plain" }
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${s.pdfName || s._id}-summary.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          className="transition-colors duration-150 group-hover:text-[#2cb67d]"
                        >
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Overall summary button below the cards */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleOverallSummary}
              disabled={fetchingOverallSummary}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                fetchingOverallSummary ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {fetchingOverallSummary && <ButtonSpinner />}
              {fetchingOverallSummary ? "Getting Summary..." : "Get Overall Summary"}
            </button>
          </div>
        </div>
        {/* Debug: Show processing status */}
        {fetchingOverallSummary && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
            <InlineSpinner text="Generating overall summary..." />
          </div>
        )}
        
        {/* Debug: Show when summary processing is complete */}
        {!fetchingOverallSummary && (
          <div className="mt-4 p-4 bg-gray-900/50 border border-gray-500 rounded-lg text-gray-300 text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>• Fetching: {fetchingOverallSummary ? 'Yes' : 'No'}</p>
            <p>• Summary exists: {overallSummary ? 'Yes' : 'No'}</p>
            <p>• Summary type: {typeof overallSummary}</p>
            <p>• Summary length: {overallSummary?.length || 0}</p>
            <p>• Summary starts with: {overallSummary?.substring?.(0, 50) || 'N/A'}</p>
            <p>• Will show summary section: {(overallSummary && overallSummary.trim()) ? 'Yes' : 'No'}</p>
          </div>
        )}
        
        {overallSummary && overallSummary.trim() && (
          <div className="mt-8 bg-[#23272f] border border-[#2cb67d] rounded-xl px-8 pt-6 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold text-[#2cb67d] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                Overall Summary
              </h2>
              <button
                onClick={() => {
                  const summaryText = typeof overallSummary === "string" ? overallSummary : (overallSummary.output_text || 'No summary available');
                  const blob = new Blob([summaryText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "overall-summary.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Download Overall Summary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download Overall Summary
              </button>
            </div>
            <div className="bg-[#18181b] p-4 rounded border border-[#2cb67d] text-[#e0e7ef]">
              {/* Debug info */}
              <div className="mb-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                Summary type: {typeof overallSummary} | Length: {overallSummary?.length || 0} chars
              </div>
              
              {typeof overallSummary === "string" && overallSummary.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-[#2cb67d] mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-[#7f5af0] mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-medium text-[#a786df] mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-[#e0e7ef] mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-3 text-[#e0e7ef]">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 text-[#e0e7ef]">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="text-[#2cb67d] font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-[#7f5af0]">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#7f5af0] pl-4 italic text-[#a786df] my-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children }) => 
                      inline ? (
                        <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#7f5af0] font-mono text-sm">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-[#2d2d2d] p-4 rounded-lg overflow-x-auto">
                          <code className="text-[#2cb67d] font-mono text-sm">{children}</code>
                        </pre>
                      ),
                  }}
                >
                  {overallSummary}
                </ReactMarkdown>
              ) : (
                <div className="text-red-400 p-4 bg-red-900/20 border border-red-500 rounded">
                  <p>⚠️ Unable to render summary. Content type: {typeof overallSummary}</p>
                  <p>Content preview: {JSON.stringify(overallSummary).substring(0, 200)}...</p>
                </div>
              )}
            </div>

            {/* Translation Section for Overall Summary */}
            <TranslationSection 
              textToTranslate={typeof overallSummary === "string" ? overallSummary : (overallSummary.output_text || 'No summary available')}
              title="Overall Summary Translation"
              className="mt-6"
              onError={(errorMsg) => setError(errorMsg)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfSummarizer;
