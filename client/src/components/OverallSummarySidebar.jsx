import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function OverallSummarySidebar() {
  const [history, setHistory] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BACKEND_URL}/api/overall-history`);
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

  // Fetch PDFs in category if on category summary page
  useEffect(() => {
    // Extract category from URL if present
    if (location.pathname === "/category-overall-summary") {
      const params = new URLSearchParams(location.search);
      const cat = params.get("category") || "";
      setCategory(cat);
      if (cat) {
        axios
          .post(`${BACKEND_URL}/api/list-pdfs-in-category`, { category: cat })
          .then((res) => setPdfs(res.data.pdfs || []))
          .catch(() => setPdfs([]));
      } else {
        setPdfs([]);
      }
    } else {
      setPdfs([]);
    }
  }, [location]);

  // Download handler for all PDF summaries in the overall summary
  const handleDownload = async (item) => {
    try {
      // Fetch the overall summary by ID to get all included summaries
      const res = await axios.get(
        `${BACKEND_URL}/api/overall-summary/${item._id}`
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

  // Delete handler for overall summary
  const handleDelete = async (item) => {
    if (
      !window.confirm("Are you sure you want to delete this overall summary?")
    )
      return;
    try {
      await axios.delete(`${BACKEND_URL}/api/overall-summary/${item._id}`);
      setHistory((prev) => prev.filter((h) => h._id !== item._id));
    } catch {
      alert("Failed to delete overall summary.");
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
                className={`w-full text-left px-3 py-2 rounded-t-lg transition-colors duration-150 bg-[#18181b] text-[#e0e7ef] hover:bg-[#0a0c0b] hover:text-[#afafbd] cursor-pointer`}
                onClick={() => navigate(`/overall-summary/${item._id}`)}
              >
                {item.caseId || item._id}
                <span className="block text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </button>
              <button
                title="Download PDF Summary"
                className="w-full flex justify-center cursor-pointer items-center bg-[#18181b] hover:bg-[#23272f] text-[#2cb67d] hover:text-[#7f5af0] rounded-b-lg py-2 border-t border-[#23272f] transition-colors duration-150"
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
              <button
                title="Delete Overall Summary"
                className="w-full flex justify-center cursor-pointer items-center bg-[#18181b] hover:bg-red-700 text-red-400 hover:text-white rounded-b-lg py-2 border-t border-[#23272f] transition-colors duration-150"
                onClick={() => handleDelete(item)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zm2 .5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6z" />
                  <path
                    fillRule="evenodd"
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3a.5.5 0 0 0-.5.5V4a.5.5 0 0 0 .5.5H13.5a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5h-11z"
                  />
                </svg>
                <span className="ml-2 text-xs font-semibold">Delete</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      {location.pathname === "/category-overall-summary" && pdfs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#2cb67d] mb-2">
            PDFs in Category
          </h3>
          <ul className="list-disc pl-6">
            {pdfs.map((pdf) => (
              <li key={pdf.public_id}>
                <a
                  href={pdf.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  {pdf.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export default OverallSummarySidebar;
