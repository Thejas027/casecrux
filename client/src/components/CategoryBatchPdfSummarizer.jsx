/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryBatchPdfSummarizer() {
  const [category, setCategory] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [translating, setTranslating] = useState(false);

  const handleListPdfs = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPdfs([]);
    setSelectedPdfs([]);
    setSummaries([]);
    setOverallSummary(null);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/list-uploaded-pdfs-by-category`,
        { category }
      );
      setPdfs(response.data.files || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to list PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPdf = (url) => {
    setSelectedPdfs((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleSummarizeSelected = async () => {
    if (!selectedPdfs.length) {
      setError("Please select at least one PDF to summarize.");
      return;
    }
    setLoading(true);
    setError("");
    setSummaries([]);
    setOverallSummary(null);
    try {
      // Use backend proxy to avoid CORS issues
      const response = await axios.post(
        `${BACKEND_URL}/api/ml/summarize_from_urls`,
        { urls: selectedPdfs }
      );
      if (response.data && response.data.overall_summary) {
        setOverallSummary(response.data.overall_summary);
      } else {
        setError("No overall summary returned.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to summarize PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!overallSummary) return;
    setTranslating(true);
    setTranslatedSummary("");
    setError("");
    try {
      // Combine the summary fields into a single string for translation
      let text = "";
      if (overallSummary.pros) text += `Pros:\n${overallSummary.pros.join("\n")}`;
      if (overallSummary.cons) text += `\n\nCons:\n${overallSummary.cons.join("\n")}`;
      if (overallSummary.final_judgment) text += `\n\nFinal Judgment:\n${overallSummary.final_judgment}`;
      if (overallSummary.raw) text += `\n${overallSummary.raw}`;
      const response = await axios.post(
        `${BACKEND_URL}/api/translate-summary`,
        { summary: text, targetLang: selectedLanguage }
      );
      setTranslatedSummary(response.data.translated);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to translate summary.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-8 border border-indigo-100">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700 text-center drop-shadow">
        Batch PDF Summarizer by Category
      </h1>
      <form
        onSubmit={handleListPdfs}
        className="flex gap-4 mb-6 justify-center"
      >
        <input
          type="text"
          className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Enter category name"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition-all duration-150"
        >
          List PDFs
        </button>
      </form>
      {loading && <div className="text-center text-indigo-500">Loading...</div>}
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      {pdfs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Select PDFs to Summarize:
          </h2>
          <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg">
            {pdfs.map((pdf) => (
              <li key={pdf.public_id} className="flex items-center px-4 py-2">
                <input
                  type="checkbox"
                  className="mr-3 accent-indigo-600"
                  checked={selectedPdfs.includes(pdf.url)}
                  onChange={() => handleSelectPdf(pdf.url)}
                  id={pdf.public_id}
                />
                <label
                  htmlFor={pdf.public_id}
                  className="flex-1 cursor-pointer text-gray-800"
                >
                  {pdf.filename}
                </label>
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-blue-600 hover:underline text-sm"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSummarizeSelected}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition-all duration-150 w-full"
            disabled={loading}
          >
            Summarize Selected PDFs
          </button>
        </div>
      )}
      {overallSummary && (
        <div className="mt-8 bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-purple-700 text-center">
            General Overall Summary
          </h2>
          <div className="space-y-4 text-lg">
            {/* Language selector and translate button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <select
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
              >
                <option value="">Select language</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="ml">Malayalam</option>
                <option value="gu">Gujarati</option>
                <option value="mr">Marathi</option>
                {/* Add more as needed */}
              </select>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all duration-150"
                onClick={handleTranslate}
                disabled={!selectedLanguage || translating}
              >
                {translating ? "Translating..." : "Translate"}
              </button>
            </div>
            {/* English summary */}
            <div>
              {overallSummary.pros && (
                <div>
                  <span className="font-semibold text-green-700">Pros:</span>
                  <ul className="list-disc pl-6 mt-1 text-green-900">
                    {overallSummary.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {overallSummary.cons && (
                <div>
                  <span className="font-semibold text-red-700">Cons:</span>
                  <ul className="list-disc pl-6 mt-1 text-red-900">
                    {overallSummary.cons.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              {overallSummary.final_judgment && (
                <div>
                  <span className="font-semibold text-blue-700">
                    Final Judgment:
                  </span>
                  <div className="mt-1 text-blue-900">
                    {overallSummary.final_judgment}
                  </div>
                </div>
              )}
              {overallSummary.raw && (
                <div className="text-gray-700 whitespace-pre-line">
                  {overallSummary.raw}
                </div>
              )}
            </div>
            {/* Translated summary */}
            {translatedSummary && (
              <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2 text-yellow-700">Translated Summary</h3>
                <div className="whitespace-pre-line text-gray-900">{translatedSummary}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryBatchPdfSummarizer;
