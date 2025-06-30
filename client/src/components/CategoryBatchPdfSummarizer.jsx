/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Helper function to get language name from code
const getLanguageName = (code) => {
  const languageNames = {
    'hi': 'Hindi',
    'kn': 'Kannada', 
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'pa': 'Punjabi',
    'bn': 'Bengali',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic'
  };
  return languageNames[code] || code;
};

function CategoryBatchPdfSummarizer({ onSummaryUpdate, onTranslationUpdate }) {
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
  const [savingToHistory, setSavingToHistory] = useState(false);

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

  // Save summary to batch history
  const saveSummaryToHistory = async (summary) => {
    setSavingToHistory(true);
    try {
      // Collect PDF names and URLs
      const pdfNames = [];
      const pdfUrls = [];
      
      // Match selected PDFs with their names
      selectedPdfs.forEach(selectedUrl => {
        const pdf = pdfs.find(p => p.url === selectedUrl);
        if (pdf) {
          pdfNames.push(pdf.filename);
          pdfUrls.push(pdf.url);
        }
      });
      
      // Save to backend
      await axios.post(`${BACKEND_URL}/api/batch-summary-history`, {
        category,
        summary,
        pdfNames,
        pdfUrls
      });
      
      console.log('Summary saved to history');
    } catch (err) {
      console.error('Failed to save summary to history:', err);
    } finally {
      setSavingToHistory(false);
    }
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
        // Call the callback if provided
        if (onSummaryUpdate) {
          onSummaryUpdate(response.data.overall_summary);
        }
        
        // Save summary to history
        await saveSummaryToHistory(response.data.overall_summary);
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
    if (!selectedLanguage) {
      setError("Please select a target language for translation.");
      return;
    }
    
    setTranslating(true);
    setTranslatedSummary("");
    setError("");
    
    try {
      console.log("Starting translation to:", selectedLanguage);
      
      // Combine the summary fields into a single string for translation
      let text = "";
      if (overallSummary.pros) text += `Pros:\n${overallSummary.pros.join("\n")}`;
      if (overallSummary.cons) text += `\n\nCons:\n${overallSummary.cons.join("\n")}`;
      if (overallSummary.final_judgment) text += `\n\nFinal Judgment:\n${overallSummary.final_judgment}`;
      if (overallSummary.raw) text += `\n${overallSummary.raw}`;
      
      console.log("Text to translate:", text.substring(0, 100) + "...");
      
      const response = await axios.post(
        `${BACKEND_URL}/api/translate-summary`,
        { summary: text, targetLang: selectedLanguage },
        {
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Translation response:", response.data);
      
      if (response.data && response.data.translated) {
        setTranslatedSummary(response.data.translated);
        // Call the callback if provided
        if (onTranslationUpdate) {
          onTranslationUpdate(response.data.translated, selectedLanguage);
        }
      } else {
        throw new Error("No translated text received from server");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError(err.response?.data?.details || err.response?.data?.error || err.message || "Failed to translate summary. Please try again.");
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
            disabled={loading || savingToHistory}
          >
            {loading ? "Summarizing..." : savingToHistory ? "Saving Summary..." : "Summarize Selected PDFs"}
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
            <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">Translation</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Language:
                  </label>
                  <select
                    id="languageSelect"
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={selectedLanguage}
                    onChange={e => setSelectedLanguage(e.target.value)}
                  >
                    <option value="">Choose a language...</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                    <option value="gu">Gujarati (ગુજરાતી)</option>
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="it">Italian (Italiano)</option>
                    <option value="pt">Portuguese (Português)</option>
                    <option value="ru">Russian (Русский)</option>
                    <option value="ja">Japanese (日本語)</option>
                    <option value="ko">Korean (한국어)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="ar">Arabic (العربية)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleTranslate}
                    disabled={!selectedLanguage || translating}
                  >
                    {translating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      </span>
                    ) : (
                      'Translate Summary'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Translation Error */}
              {error && error.includes("translate") && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            {/* English summary */}
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-indigo-700 mb-3">Original Summary (English)</h3>
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
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-700 mb-3">
                  Translated Summary ({getLanguageName(selectedLanguage)})
                </h3>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-green-900 leading-relaxed">
                    {translatedSummary}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>  );
}

CategoryBatchPdfSummarizer.propTypes = {
  onSummaryUpdate: PropTypes.func,
  onTranslationUpdate: PropTypes.func
};

CategoryBatchPdfSummarizer.defaultProps = {
  onSummaryUpdate: null,
  onTranslationUpdate: null
};

export default CategoryBatchPdfSummarizer;
