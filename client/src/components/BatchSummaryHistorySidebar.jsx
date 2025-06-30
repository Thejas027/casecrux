import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { InlineSpinner } from "./Spinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function BatchSummaryHistorySidebar() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BACKEND_URL}/api/batch-summary-history`);
        setHistory(res.data.history || []);
      } catch (err) {
        setError("Failed to fetch batch summary history.");
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Download handler for batch summary
  const handleDownload = async (item) => {
    try {
      // Create the content for download
      let content = `Category: ${item.category}\n\n`;
      
      // Add PDF names if available
      if (item.pdfNames && item.pdfNames.length) {
        content += "PDFs included:\n";
        item.pdfNames.forEach((name, i) => {
          content += `${i+1}. ${name}\n`;
        });
        content += "\n";
      }
      
      // Add summary content
      if (item.summary) {
        if (item.summary.pros && item.summary.pros.length) {
          content += "Pros:\n" + item.summary.pros.map(pro => `- ${pro}`).join("\n") + "\n\n";
        }
        
        if (item.summary.cons && item.summary.cons.length) {
          content += "Cons:\n" + item.summary.cons.map(con => `- ${con}`).join("\n") + "\n\n";
        }
        
        if (item.summary.final_judgment) {
          content += "Final Judgment:\n" + item.summary.final_judgment + "\n\n";
        }
        
        if (item.summary.raw) {
          content += "Raw Summary:\n" + item.summary.raw + "\n";
        }
      }
      
      // Create and download the file
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-summary-${item.category}-${item._id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download summary.");
    }
  };

  // Delete handler for batch summary
  const handleDelete = async (item) => {
    if (!window.confirm("Are you sure you want to delete this batch summary?")) {
      return;
    }
    
    try {
      await axios.delete(`${BACKEND_URL}/api/batch-summary-history/${item._id}`);
      setHistory(prev => prev.filter(h => h._id !== item._id));
    } catch (err) {
      alert("Failed to delete batch summary.");
    }
  };

  // Format the date in a readable way
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <aside className="w-72 bg-[#23272f] border-r-2 border-[#7f5af0] min-h-screen p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-[#7f5af0]">
        Batch Summary History
      </h2>
      
      {loading && <InlineSpinner text="Loading history..." />}
      {error && <div className="text-red-400">{error}</div>}
      
      {!loading && !error && history.length === 0 && (
        <div className="text-[#e0e7ef]">No batch summaries found.</div>
      )}
      
      <ul className="flex-1 overflow-y-auto space-y-2">
        {history.map((item) => (
          <li key={item._id}>
            <div className="bg-[#18181b] rounded-lg flex flex-col p-0">
              <button
                className="w-full text-left px-3 py-2 rounded-t-lg transition-colors duration-150 bg-[#18181b] text-[#e0e7ef] hover:bg-[#0a0c0b] hover:text-[#afafbd] cursor-pointer"
                onClick={() => navigate(`/batch-summary/${item._id}`)}
              >
                <div className="font-medium">{item.category}</div>
                <span className="block text-xs text-gray-400">
                  {formatDate(item.createdAt)}
                </span>
                <span className="block text-xs text-indigo-300 mt-1">
                  {item.pdfNames?.length || 0} PDFs summarized
                </span>
              </button>
              
              <div className="flex">
                <button
                  title="Download Summary"
                  className="flex-1 flex justify-center cursor-pointer items-center bg-[#18181b] hover:bg-[#23272f] text-[#2cb67d] hover:text-[#7f5af0] py-2 border-t border-[#23272f] transition-colors duration-150"
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
                </button>
                
                <button
                  title="Delete Summary"
                  className="flex-1 flex justify-center cursor-pointer items-center bg-[#18181b] hover:bg-red-700 text-red-400 hover:text-white py-2 border-t border-[#23272f] transition-colors duration-150"
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
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default BatchSummaryHistorySidebar;
