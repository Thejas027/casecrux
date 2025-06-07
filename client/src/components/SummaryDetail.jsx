import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function SummaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`http://localhost:5000/api/summaries`);
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

  if (loading)
    return <div className="text-center text-lg mt-8">Loading...</div>;
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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-[#7f5af0] hover:text-[#2cb67d] font-bold text-lg"
        >
          ← Back
        </button>
        <h1
          className="text-3xl font-extrabold mb-4"
          style={{ color: "#7f5af0" }}
        >
          {summary.pdfName}
        </h1>
        <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0] text-lg">
          {summaryText}
        </pre>
      </div>
    </div>
  );
}

export default SummaryDetail;
