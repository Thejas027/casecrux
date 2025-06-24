import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
      if (summary.summary.pros) {
        text += `Pros:\n${summary.summary.pros.join("\n")}`;
      }
      if (summary.summary.cons) {
        text += `\n\nCons:\n${summary.summary.cons.join("\n")}`;
      }
      if (summary.summary.final_judgment) {
        text += `\n\nFinal Judgment:\n${summary.summary.final_judgment}`;
      }
      if (summary.summary.raw) {
        text += `\n${summary.summary.raw}`;
      }
      
      const response = await axios.post(
        `${BACKEND_URL}/api/translate-summary`,
        { summary: text, targetLang: selectedLanguage }
      );
      
      setTranslatedSummary(response.data.translated);
      
      // Save translation to batch summary
      await axios.post(`${BACKEND_URL}/api/batch-summary-history/${id}/translations`, {
        language: selectedLanguage,
        text: response.data.translated
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to translate summary.");
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
    return <div className="p-8 text-center">Loading summary...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center">Summary not found.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link
        to="/category-batch-pdf-summarizer"
        className="inline-block mb-6 text-indigo-600 hover:text-indigo-800"
      >
        &larr; Back to Batch Summarizer
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {summary.category} Summary
          </h1>
          <span className="text-sm text-gray-500">
            {new Date(summary.createdAt).toLocaleString()}
          </span>
        </div>
        
        {/* PDFs section */}
        {summary.pdfNames && summary.pdfNames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">PDFs Included:</h2>
            <ul className="list-disc pl-6 space-y-1">
              {summary.pdfNames.map((name, i) => (
                <li key={i} className="text-gray-600">
                  {summary.pdfUrls && summary.pdfUrls[i] ? (
                    <a 
                      href={summary.pdfUrls[i]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
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
        )}
        
        {/* Summary section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Summary:</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            {summary.summary.pros && summary.summary.pros.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700">Pros:</h3>
                <ul className="list-disc pl-6 mt-2">
                  {summary.summary.pros.map((pro, index) => (
                    <li key={index} className="text-gray-700 mb-1">{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.summary.cons && summary.summary.cons.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700">Cons:</h3>
                <ul className="list-disc pl-6 mt-2">
                  {summary.summary.cons.map((con, index) => (
                    <li key={index} className="text-gray-700 mb-1">{con}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.summary.final_judgment && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700">Final Judgment:</h3>
                <p className="mt-2 text-gray-700">{summary.summary.final_judgment}</p>
              </div>
            )}
            
            {summary.summary.raw && (
              <div>
                <h3 className="font-bold text-gray-700">Additional Details:</h3>
                <p className="mt-2 text-gray-700 whitespace-pre-line">{summary.summary.raw}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Translation section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Translations:</h2>
          <div className="flex items-center gap-4 mb-4">
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
            </select>
            
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition-all duration-150 disabled:bg-gray-400"
              onClick={handleTranslate}
              disabled={!selectedLanguage || translating}
            >
              {translating ? "Translating..." : "Translate"}
            </button>
          </div>
          
          {/* Show existing translations */}
          {summary.translations && summary.translations.length > 0 && !translatedSummary && (
            <div className="text-sm text-gray-500 mb-3">
              Existing translations: {summary.translations.map(t => t.language).join(", ")}
            </div>
          )}
          
          {/* Translated text */}
          {translatedSummary && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <h3 className="font-bold text-yellow-800 mb-2">Translated Summary:</h3>
              <p className="whitespace-pre-line text-gray-800">{translatedSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchSummaryDetail;
