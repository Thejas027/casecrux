import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

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

function BatchSummaryDetail() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BACKEND_URL}/api/batch-summary-history/${id}`);
        setSummary(res.data);
      } catch (err) {
        setError("Failed to fetch batch summary.");
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchSummary();
    }
  }, [id]);

  const handleTranslate = async () => {
    if (!summary || !selectedLanguage) return;
    
    setTranslating(true);
    setTranslatedSummary("");
    setError("");
    
    try {
      // Combine the summary fields into a single string for translation
      let text = "";
      if (summary.summary.pros && summary.summary.pros.length > 0) {
        text += `Pros:\n${summary.summary.pros.join("\n")}`;
      }
      if (summary.summary.cons && summary.summary.cons.length > 0) {
        text += `\n\nCons:\n${summary.summary.cons.join("\n")}`;
      }
      if (summary.summary.final_judgment) {
        text += `\n\nFinal Judgment:\n${summary.summary.final_judgment}`;
      }
      if (summary.summary.raw) {
        text += `\n\nAdditional Details:\n${summary.summary.raw}`;
      }
      
      const response = await axios.post(
        `${BACKEND_URL}/api/translate-summary`,
        { summary: text, targetLang: selectedLanguage },
        { timeout: 30000 }
      );
      
      setTranslatedSummary(response.data.translated);
      
      // Save translation to batch summary
      try {
        await axios.post(`${BACKEND_URL}/api/batch-summary-history/${id}/translations`, {
          language: selectedLanguage,
          text: response.data.translated
        });
      } catch (saveErr) {
        console.warn("Failed to save translation to history:", saveErr);
        // Don't show error to user as translation still succeeded
      }
    } catch (err) {
      console.error("Translation error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to translate summary. Please try again.";
      setError(errorMessage);
    } finally {
      setTranslating(false);
    }
  };

  // Try to find an existing translation
  useEffect(() => {
    if (summary && selectedLanguage && summary.translations) {
      const existingTranslation = summary.translations.find(
        t => t.language === selectedLanguage
      );
      
      if (existingTranslation) {
        setTranslatedSummary(existingTranslation.text);
      } else {
        setTranslatedSummary("");
      }
    }
  }, [summary, selectedLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] p-8 text-center">
        <div className="text-lg">Loading summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] p-8 text-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] p-8 text-center">
        <div className="text-lg">Summary not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="container mx-auto p-6 max-w-4xl">
        <Link
          to="/category-batch-pdf-summarizer"
          className="inline-block mb-6 text-[#7f5af0] hover:text-[#2cb67d] transition-colors duration-150 font-medium"
        >
          &larr; Back to Batch Summarizer
        </Link>
        
        <div className="bg-[#23272f] rounded-xl shadow-2xl p-8 border-2 border-[#7f5af0]">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#7f5af0]">
              {summary.category} Summary
            </h1>
            <span className="text-sm text-[#a786df]">
              {new Date(summary.createdAt).toLocaleString()}
            </span>
          </div>
          
          {/* PDFs section */}
          {summary.pdfNames && summary.pdfNames.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">PDFs Included:</h2>
              <div className="bg-[#18181b] p-4 rounded-lg border border-[#7f5af0]">
                <ul className="list-disc pl-6 space-y-2">
                  {summary.pdfNames.map((name, i) => (
                    <li key={i} className="text-[#e0e7ef]">
                      {summary.pdfUrls && summary.pdfUrls[i] ? (
                        <a 
                          href={summary.pdfUrls[i]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#7f5af0] hover:text-[#2cb67d] transition-colors duration-150 underline"
                        >
                          {name}
                        </a>
                      ) : (
                        name
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Summary section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">Summary:</h2>
            <div className="bg-[#18181b] p-6 rounded-lg border border-[#7f5af0]">
              {summary.summary.pros && summary.summary.pros.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Pros:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    {summary.summary.pros.map((pro, index) => (
                      <li key={index} className="text-[#e0e7ef]">{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary.summary.cons && summary.summary.cons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Cons:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    {summary.summary.cons.map((con, index) => (
                      <li key={index} className="text-[#e0e7ef]">{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary.summary.final_judgment && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Final Judgment:</h3>
                  <p className="text-[#e0e7ef] leading-relaxed">{summary.summary.final_judgment}</p>
                </div>
              )}
              
              {summary.summary.raw && (
                <div>
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Additional Details:</h3>
                  <p className="text-[#e0e7ef] whitespace-pre-line leading-relaxed">{summary.summary.raw}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Translation section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">Translations:</h2>
            <div className="bg-[#18181b] p-6 rounded-lg border border-[#7f5af0]">
              <div className="flex items-center gap-4 mb-4">
                <select
                  className="bg-[#23272f] border-2 border-[#7f5af0] rounded-lg px-4 py-2 text-[#e0e7ef] focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] transition-all duration-150"
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                >
                  <option value="">Select language</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="ml">Malayalam</option>
                  <option value="gu">Gujarati</option>
                  <option value="mr">Marathi</option>
                  <option value="pa">Punjabi</option>
                  <option value="bn">Bengali</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="ar">Arabic</option>
                </select>
                
                <button
                  className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] px-6 py-2 rounded-lg font-semibold shadow-lg transition-all duration-300 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
                  onClick={handleTranslate}
                  disabled={!selectedLanguage || translating}
                >
                  {translating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#18181b] mr-2"></div>
                      Translating...
                    </div>
                  ) : (
                    `Translate to ${selectedLanguage ? getLanguageName(selectedLanguage) : ''}`
                  )}
                </button>
              </div>
              
              {/* Show existing translations */}
              {summary.translations && summary.translations.length > 0 && !translatedSummary && (
                <div className="text-sm text-[#a786df] mb-4">
                  Existing translations: {summary.translations.map(t => getLanguageName(t.language)).join(", ")}
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              {/* Translated text */}
              {translatedSummary && (
                <div className="bg-gradient-to-r from-[#2cb67d]/10 to-[#7f5af0]/10 border-2 border-[#2cb67d] p-6 rounded-lg">
                  <h3 className="font-bold text-[#2cb67d] text-lg mb-3">
                    Translated Summary ({getLanguageName(selectedLanguage)}):
                  </h3>
                  <p className="whitespace-pre-line text-[#e0e7ef] leading-relaxed">{translatedSummary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchSummaryDetail;
