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
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-5xl font-extrabold text-center mb-8 tracking-wider"
          style={{
            color: "#ffffff",
          }}
        >
          CaseCrux
        </h1>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#7f5af0" }}>
            Batch PDF Summarizer by Category
          </h2>
        </div>
        
        {/* Category Input Form */}
        <form
          onSubmit={handleListPdfs}
          className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]"
        >
          <div className="mb-6">
            <label
              htmlFor="category-input"
              className="block text-[#7f5af0] text-lg font-bold mb-2"
            >
              Category Name:
            </label>
            <input
              id="category-input"
              type="text"
              placeholder="Enter category name"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#18181b] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0] text-lg"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 cursor-pointer ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Loading PDFs..." : "List PDFs"}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div
            className="bg-[#2cb67d] border border-[#7f5af0] text-[#18181b] px-4 py-3 rounded relative mb-4 text-lg"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* PDF Selection */}
        {pdfs.length > 0 && (
          <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#2cb67d]">
            <h3 className="text-2xl font-bold mb-6" style={{ color: "#2cb67d" }}>
              Select PDFs to Summarize:
            </h3>
            <div className="space-y-3 mb-6">
              {pdfs.map((pdf) => (
                <div key={pdf.public_id} className="bg-[#18181b] border border-[#7f5af0] rounded-lg p-4 flex items-center">
                  <input
                    type="checkbox"
                    className="mr-4 w-5 h-5 text-[#7f5af0] bg-[#18181b] border-[#7f5af0] rounded focus:ring-[#7f5af0] focus:ring-2"
                    checked={selectedPdfs.includes(pdf.url)}
                    onChange={() => handleSelectPdf(pdf.url)}
                    id={pdf.public_id}
                  />
                  <label
                    htmlFor={pdf.public_id}
                    className="flex-1 cursor-pointer text-[#e0e7ef] text-lg"
                  >
                    {pdf.filename}
                  </label>
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-[#7f5af0] hover:text-[#2cb67d] text-sm underline transition-colors duration-150"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
            <button
              onClick={handleSummarizeSelected}
              disabled={loading || savingToHistory || selectedPdfs.length === 0}
              className={`w-full bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 ${
                loading || savingToHistory || selectedPdfs.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {loading 
                ? "Summarizing..." 
                : savingToHistory 
                  ? "Saving Summary..." 
                  : "Summarize Selected PDFs"
              }
            </button>
          </div>
        )}

        {/* Summary Display */}
        {overallSummary && (
          <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: "#7f5af0" }}>
                General Overall Summary
              </h3>
              <button
                onClick={() => {
                  let content = `Category: ${category}\n\n`;
                  if (overallSummary.pros) content += `Pros:\n${overallSummary.pros.join("\n")}\n\n`;
                  if (overallSummary.cons) content += `Cons:\n${overallSummary.cons.join("\n")}\n\n`;
                  if (overallSummary.final_judgment) content += `Final Judgment:\n${overallSummary.final_judgment}\n\n`;
                  if (overallSummary.raw) content += `Raw Summary:\n${overallSummary.raw}`;
                  
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `batch-summary-${category}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-[#2cb67d] hover:bg-[#7f5af0] text-[#18181b] font-bold py-1 px-4 rounded-lg text-sm"
                title="Download Summary"
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
            </div>

            {/* Original Summary Content */}
            <div className="bg-[#18181b] border border-[#7f5af0] rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#7f5af0" }}>
                Original Summary (English)
              </h4>
              <div className="space-y-4 text-[#e0e7ef]">
                {overallSummary.pros && (
                  <div>
                    <span className="font-semibold" style={{ color: "#2cb67d" }}>Pros:</span>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      {overallSummary.pros.map((pro, idx) => (
                        <li key={idx} className="text-[#e0e7ef]">{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {overallSummary.cons && (
                  <div>
                    <span className="font-semibold text-red-400">Cons:</span>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      {overallSummary.cons.map((con, idx) => (
                        <li key={idx} className="text-[#e0e7ef]">{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {overallSummary.final_judgment && (
                  <div>
                    <span className="font-semibold" style={{ color: "#7f5af0" }}>
                      Final Judgment:
                    </span>
                    <div className="mt-2 text-[#e0e7ef]">
                      {overallSummary.final_judgment}
                    </div>
                  </div>
                )}
                
                {overallSummary.raw && (
                  <div className="text-[#e0e7ef] whitespace-pre-line">
                    {overallSummary.raw}
                  </div>
                )}
              </div>
            </div>

            {/* Translation Section */}
            <div className="bg-[#18181b] border border-[#2cb67d] rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#2cb67d" }}>
                Translation
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="languageSelect" className="block text-sm font-medium text-[#e0e7ef] mb-2">
                    Select Target Language:
                  </label>
                  <select
                    id="languageSelect"
                    className="shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#23272f] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0]"
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
                <div>
                  <button
                    className={`bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 ${
                      !selectedLanguage || translating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
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
                <div className="bg-red-500 border border-red-400 text-white px-4 py-3 rounded mb-4">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {/* Translated Summary */}
              {translatedSummary && (
                <div className="bg-[#23272f] border border-[#2cb67d] rounded-lg p-4">
                  <h5 className="font-semibold mb-3" style={{ color: "#2cb67d" }}>
                    Translated Summary ({getLanguageName(selectedLanguage)})
                  </h5>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-[#e0e7ef] leading-relaxed">
                      {translatedSummary}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
