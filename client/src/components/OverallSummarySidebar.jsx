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
            <button
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
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
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default OverallSummarySidebar;
