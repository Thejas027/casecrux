import React, { useEffect, useState } from "react";
import axios from "axios";

function OverallSummarySidebar({ onSelect, selectedId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          "http://localhost:5000/api/overall-history"
        );
        setHistory(res.data.history || []);
      } catch (err) {
        setError("Failed to fetch overall summary history.");
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Download handler for all PDF summaries in the overall summary
  const handleDownload = async (item) => {
    try {
      // Fetch the overall summary by ID to get all included summaries
      const res = await axios.get(
        `http://localhost:5000/api/overall-summary/${item._id}`
      );
      const overall = res.data;
      if (!overall.summaries || !overall.summaries.length) {
        alert("No PDF summaries found for this overall summary.");
        return;
      }
      let content = overall.summaries
        .map((s, idx) => {
          const summaryText =
            typeof s.summary === "string"
              ? s.summary
              : s.summary.output_text || JSON.stringify(s.summary, null, 2);
          return `PDF: ${s.pdfName || idx + 1}\n${summaryText}\n\n`;
        })
        .join("\n----------------------\n\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-summaries-${item._id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF summaries.");
    }
  };

  return (
    <aside className="w-72 bg-[#23272f] border-r-2 border-[#7f5af0] min-h-screen p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-[#7f5af0]">
        Overall Summary History
      </h2>
      {loading && <div className="text-[#e0e7ef]">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="flex-1 overflow-y-auto space-y-2">
        {history.map((item) => (
          <li key={item._id}>
            <div className="bg-[#18181b] rounded-lg flex flex-col p-0">
              <button
                className={`w-full text-left px-3 py-2 rounded-t-lg transition-colors duration-150 ${
                  selectedId === item._id
                    ? "bg-[#7f5af0] text-white"
                    : "bg-[#18181b] text-[#e0e7ef] hover:bg-[#2cb67d] hover:text-[#18181b]"
                }`}
                onClick={() => onSelect(item._id)}
              >
                {item.caseId || item._id}
                <span className="block text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </button>
              <button
                title="Download PDF Summary"
                className="w-full flex justify-center items-center bg-[#18181b] hover:bg-[#23272f] text-[#2cb67d] hover:text-[#7f5af0] rounded-b-lg py-2 border-t border-[#23272f] transition-colors duration-150"
                onClick={() => handleDownload(item)}
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
                <span className="ml-2 text-xs font-semibold">
                  Download PDF Summary
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default OverallSummarySidebar;
