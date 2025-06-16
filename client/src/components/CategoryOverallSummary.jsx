import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryOverallSummary() {
  const [category, setCategory] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit} className="mb-6">
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
          {loading ? "Summarizing..." : "Get Overall Summary"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
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
