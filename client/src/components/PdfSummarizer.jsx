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
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl font-extrabold text-center mb-8"
          style={{
            color: "#7f5af0",
            textShadow: "0 0 10px #7f5af0, 0 0 20px #7f5af0",
          }}
        >
          PDF Summarizer
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
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 ${
                isLoading || !file ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
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
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ color: "#7f5af0" }}
            >
              Latest Summary:
            </h2>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-[#e0e7ef]">
              <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0]">
                {summary}
              </pre>
            </div>
          </div>
        )}
        {allSummaries.length > 0 && (
          <div className="mt-8 bg-[#23272f] shadow-xl rounded-xl px-8 pt-6 pb-8 border-2 border-[#7f5af0]">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#7f5af0" }}>
              All Summaries
            </h2>
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
                  <SummaryCard
                    key={s._id}
                    _id={s._id}
                    pdfName={s.pdfName}
                    preview={preview}
                    onDelete={handleDeleteSummary}
                    onShowDetail={() => navigate(`/summary/${s._id}`)}
                    accentColor={idx % 2 === 0 ? "#7f5af0" : "#2cb67d"}
                  />
                );
              })}
            </div>
            <button
              onClick={handleOverallSummary}
              className="mt-8 bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-[#18181b] font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 shadow-neon"
            >
              Get Overall Summary
            </button>
          </div>
        )}
        {overallSummary && (
          <div className="mt-8 bg-[#18181b] shadow-2xl rounded-xl px-8 pt-6 pb-8 border-2 border-[#2cb67d]">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#2cb67d" }}>
              Overall Summary
            </h2>
            {Array.isArray(overallSummary.pros) ||
            Array.isArray(overallSummary.cons) ||
            overallSummary.finalJudgment ||
            overallSummary.acts_used ? (
              <>
                {overallSummary.overall_summary && (
                  <section className="mb-4">
                    <h3 className="font-bold text-[#7f5af0] text-lg mb-1">
                      Summary
                    </h3>
                    <pre className="whitespace-pre-wrap text-[#e0e7ef] bg-[#23272f] p-4 rounded">
                      {overallSummary.overall_summary}
                    </pre>
                  </section>
                )}
                {overallSummary.pros && overallSummary.pros.length > 0 && (
                  <section className="mb-4">
                    <h3 className="font-bold text-green-400 text-lg mb-1">
                      Pros
                    </h3>
                    <ul className="list-disc pl-6">
                      {overallSummary.pros.map((pro, i) => (
                        <li key={i} className="text-green-300">
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {overallSummary.cons && overallSummary.cons.length > 0 && (
                  <section className="mb-4">
                    <h3 className="font-bold text-red-400 text-lg mb-1">
                      Cons
                    </h3>
                    <ul className="list-disc pl-6">
                      {overallSummary.cons.map((con, i) => (
                        <li key={i} className="text-red-300">
                          {con}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {overallSummary.final_judgment && (
                  <section className="mb-4">
                    <h3 className="font-bold text-blue-400 text-lg mb-1">
                      Final Judgment
                    </h3>
                    <pre className="whitespace-pre-wrap text-[#e0e7ef] bg-[#23272f] p-4 rounded">
                      {overallSummary.final_judgment}
                    </pre>
                  </section>
                )}
                {overallSummary.acts_used &&
                  overallSummary.acts_used.length > 0 && (
                    <section className="mb-4">
                      <h3 className="font-bold text-purple-400 text-lg mb-1">
                        Acts/Sections Used
                      </h3>
                      <ul className="list-disc pl-6">
                        {overallSummary.acts_used.map((act, i) => (
                          <li key={i} className="text-purple-300">
                            {act}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
              </>
            ) : (
              <pre className="whitespace-pre-wrap text-[#2cb67d] bg-[#23272f] p-4 rounded">
                {typeof overallSummary === "string"
                  ? overallSummary
                  : JSON.stringify(overallSummary, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  _id,
  pdfName,
  preview,
  onDelete,
  onShowDetail,
  accentColor,
}) {
  return (
    <div
      className="bg-gradient-to-br from-[#23272f] to-[#18181b] shadow-lg rounded-lg p-4 border-2"
      style={{ borderColor: accentColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="font-semibold text-lg truncate"
          title={pdfName}
          style={{ color: accentColor }}
        >
          {pdfName}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onShowDetail()}
            className="text-xs bg-[#7f5af0] hover:bg-[#2cb67d] text-white px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon"
          >
            Show
          </button>
          <button
            onClick={() => onDelete(_id)}
            className="text-xs bg-[#2cb67d] hover:bg-[#7f5af0] text-[#18181b] px-3 py-1 rounded focus:outline-none focus:shadow-outline shadow-neon"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="text-[#e0e7ef] text-sm whitespace-pre-wrap">
        {preview}
      </div>
    </div>
  );
}

export default PdfSummarizer;
