import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ButtonSpinner } from "./Spinner";

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
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Category Overall Summary</h1>
      <form onSubmit={handleListPdfs} className="mb-6">
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Enter category (e.g. robbery)"
          className="border p-2 rounded w-2/3 mr-2"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          disabled={loading || !category}
        >
          {loading ? <ButtonSpinner text="Loading..." /> : "Show PDFs"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {pdfs.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">PDFs in "{category}"</h2>
          <ul className="list-disc pl-6">
            {pdfs.map((pdf) => (
              <li key={pdf.public_id}>
                <a
                  href={pdf.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {pdf.filename}
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSummarize}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? <ButtonSpinner text="Summarizing..." /> : "Summarize All"}
          </button>
        </div>
      )}
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Overall Summary:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result.overall_summary, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default CategoryOverallSummary;
