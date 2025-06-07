import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PdfSummarizer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [allSummaries, setAllSummaries] = useState([]);
  const [overallSummary, setOverallSummary] = useState("");
  const navigate = useNavigate();

  // Fetch all summaries from backend on mount
  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/summaries");
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
        "http://localhost:5000/api/summarize",
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
    setOverallSummary("");
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/api/overall-summary");
      setOverallSummary(res.data.overallSummary || "");
    } catch (err) {
      setError("Failed to get overall summary.");
      console.error("Error fetching overall summary:", err.message);
    }
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this summary?`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/summaries/${id}`);
      setAllSummaries((prev) => prev.filter((s) => s._id !== id));
      setSummary("");
      setOverallSummary("");
      setError("");
    } catch (err) {
      setError("Failed to delete summary. Please try again.");
      console.error("Error deleting summary:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#18181b] to-[#0e2222] text-[#e0e7ef] py-8 px-2">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl font-extrabold text-center mb-8"
          style={{
            color: "#22d3ee", // cyan-400
          }}
        >
          CaseCrux
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-[#18181b] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-cyan-400"
        >
          <div className="mb-6">
            <label
              htmlFor="pdf-upload"
              className="block text-cyan-400 text-lg font-bold mb-2"
            >
              Upload PDF:
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="shadow appearance-none border border-cyan-400 rounded w-full py-2 px-3 bg-black text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading || !file}
              className={`bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 ${
                isLoading || !file ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </form>
        {error && (
          <div
            className="bg-cyan-600 border border-cyan-400 text-black px-4 py-3 rounded relative mb-4 text-lg"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {summary && (
          <div className="mt-6 bg-[#18181b] shadow-md rounded-xl px-8 pt-6 pb-8 border border-cyan-400">
            <div className="flex justify-between items-center mb-3">
              <h2
                className="text-2xl font-semibold"
                style={{ color: "#22d3ee" }}
              >
                Latest Summary:
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
                className="bg-cyan-400 hover:bg-cyan-600 text-black font-bold py-1 px-4 rounded-lg text-sm ml-2"
                title="Download PDF Summary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                </svg>
              </button>
            </div>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-[#e0e7ef]">
              <pre className="whitespace-pre-wrap bg-black p-4 rounded text-[#e0e7ef] border border-cyan-400">
                {summary}
              </pre>
            </div>
          </div>
        )}
        {/* Flat list of all summaries, no category grouping */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: "#22d3ee" }}>
              All Summaries
            </h2>
          </div>
          {allSummaries.length === 0 ? (
            <div className="text-lg text-cyan-300">No summaries yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {allSummaries.map((s, idx) => {
                const summaryText =
                  typeof s.summary === "string"
                    ? s.summary
                    : s.summary.output_text || JSON.stringify(s.summary);
                const preview =
                  summaryText.length > 180
                    ? summaryText.slice(0, 180) + "..."
                    : summaryText;
                return (
                  <div
                    key={s._id}
                    className="bg-gradient-to-br from-[#18181b] to-black shadow-lg rounded-lg p-4 border-2 flex flex-col justify-between"
                    style={{
                      borderColor: idx % 2 === 0 ? "#22d3ee" : "#06b6d4",
                    }}
                  >
                    <div>
                      <span
                        className="font-semibold text-lg truncate"
                        title={s.pdfName}
                        style={{ color: idx % 2 === 0 ? "#22d3ee" : "#06b6d4" }}
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
                        className="text-xs bg-cyan-400 hover:bg-cyan-600 text-black px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon transition-colors duration-150"
                      >
                        Show
                      </button>
                      <button
                        onClick={() => handleDeleteSummary(s._id)}
                        className="text-xs bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon transition-colors duration-150"
                      >
                        Delete
                      </button>
                      <button
                        title="Download PDF Summary"
                        className="text-xs bg-black border border-cyan-400 text-cyan-400 px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon flex items-center group transition-colors duration-150"
                        onClick={() => {
                          const blob = new Blob(
                            [
                              typeof s.summary === "string"
                                ? s.summary
                                : s.summary.output_text ||
                                  JSON.stringify(s.summary, null, 2),
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
                          className="transition-colors duration-150 group-hover:text-cyan-300"
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
              className="bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200"
            >
              Get Overall Summary
            </button>
          </div>
        </div>
        {overallSummary && (
          <div className="mt-8 bg-[#18181b] border border-cyan-400 rounded-xl px-8 pt-6 pb-8">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#22d3ee" }}
            >
              Overall Summary
            </h2>
            <div className="whitespace-pre-wrap text-[#e0e7ef] text-base">
              {typeof overallSummary === "string"
                ? overallSummary
                : JSON.stringify(overallSummary, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfSummarizer;
