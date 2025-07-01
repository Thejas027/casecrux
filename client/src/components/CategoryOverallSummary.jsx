import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ButtonSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryOverallSummary() {
  const [category, setCategory] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleListPdfs = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setPdfs([]);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/list-pdfs-in-category`,
        { category }
      );
      setPdfs(response.data.pdfs || []);
      // Update the URL so the sidebar can react
      navigate(
        `/category-overall-summary?category=${encodeURIComponent(category)}`
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to list PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/category-overall-summary`,
        { category }
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get overall summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#7f5af0]">Category Overall Summary</h1>
        
        <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]">
          <form onSubmit={handleListPdfs} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category (e.g. robbery)"
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg px-4 py-3 flex-1 text-[#e0e7ef] placeholder-[#a786df] focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] transition-all duration-150"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !category}
              >
                {loading ? <ButtonSpinner text="Loading..." /> : "Show PDFs"}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-6">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </div>
        
        {pdfs.length > 0 && (
          <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]">
            <h2 className="text-2xl font-semibold text-[#7f5af0] mb-4">PDFs in "{category}"</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              {pdfs.map((pdf) => (
                <li key={pdf.public_id}>
                  <a
                    href={pdf.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2cb67d] hover:text-[#7f5af0] underline transition-colors duration-150"
                  >
                    {pdf.filename}
                  </a>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSummarize}
              className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <ButtonSpinner text="Summarizing..." /> : "Summarize All"}
            </button>
          </div>
        )}
      {result && (
        <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#7f5af0]">Overall Summary:</h2>
            <button
              onClick={() => {
                const summaryText = JSON.stringify(result.overall_summary, null, 2);
                const blob = new Blob([summaryText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${category}-overall-summary.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Download Overall Summary"
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
          <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0]">
            {JSON.stringify(result.overall_summary, null, 2)}
          </pre>
          
          {/* Translation Section */}
          <TranslationSection 
            textToTranslate={JSON.stringify(result.overall_summary, null, 2)}
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

export default CategoryOverallSummary;
