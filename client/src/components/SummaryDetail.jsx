import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { FullPageSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function SummaryDetail() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BACKEND_URL}/api/summaries`);
        const found = (res.data.summaries || []).find((s) => s._id === id);
        if (!found) {
          setError("Summary not found.");
        } else {
          setSummary(found);
        }
      } catch (err) {
        setError("Failed to fetch summary.");
        console.log("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [id]);

  // Breadcrumbs
  const breadcrumbs = (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex text-[#7f5af0]">
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <span className="mx-2">&gt;</span>
        </li>
        <li className="text-[#2cb67d] font-semibold">Summary-{id}</li>
      </ol>
    </nav>
  );

  if (loading)
    return <FullPageSpinner text="Loading summary..." />;
  if (error)
    return <div className="text-center text-red-400 mt-8">{error}</div>;
  if (!summary) return null;

  const summaryText =
    typeof summary.summary === "string"
      ? summary.summary
      : summary.summary.output_text || JSON.stringify(summary.summary);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="max-w-2xl mx-auto bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
        {breadcrumbs}
        <h1
          className="text-3xl font-extrabold mb-4 flex items-center justify-between"
          style={{ color: "#7f5af0" }}
        >
          <span>{summary.pdfName}</span>
          <button
            title="Download PDF Summary"
            className="ml-4 bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => {
              const blob = new Blob(
                [
                  typeof summary.summary === "string"
                    ? summary.summary
                    : summary.summary.output_text ||
                      JSON.stringify(summary.summary, null, 2),
                ],
                { type: "text/plain" }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${summary.pdfName || summary._id}-summary.txt`;
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
            >
              <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
            </svg>
            Download Summary
          </button>
        </h1>
        <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0] text-lg">
          {summaryText}
        </pre>

        {/* Translation Section */}
        <TranslationSection 
          textToTranslate={summaryText}
          title="Summary Translation"
          className="mt-6"
          onError={(errorMsg) => setError(errorMsg)}
        />
      </div>
    </div>
  );
}

export default SummaryDetail;
