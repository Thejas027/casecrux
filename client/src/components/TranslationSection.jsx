import React, { useState } from "react";
import axios from "axios";
import { ButtonSpinner } from "./Spinner";
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

function TranslationSection({ 
  textToTranslate, 
  onTranslationComplete, 
  onError, 
  disabled = false,
  title = "Translation",
  className = "",
  showLanguageLabel = true
}) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!textToTranslate || !selectedLanguage) {
      const errorMsg = "Please ensure there's text to translate and select a target language.";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    setTranslating(true);
    setTranslatedText("");
    setError("");
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/translate-summary`,
        { summary: textToTranslate, targetLang: selectedLanguage },
        { timeout: 30000 }
      );
      
      if (response.data && response.data.translated) {
        setTranslatedText(response.data.translated);
        if (onTranslationComplete) {
          onTranslationComplete(response.data.translated, selectedLanguage);
        }
      } else {
        throw new Error("No translated text received from server");
      }
    } catch (err) {
      console.error("Translation error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to translate text. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setTranslating(false);
    }
  };

  // Clear translation when input text changes
  React.useEffect(() => {
    setTranslatedText("");
    setError("");
  }, [textToTranslate]);

  if (!textToTranslate) {
    return null; // Don't render if there's nothing to translate
  }

  return (
    <div className={`bg-[#18181b] border border-[#2cb67d] rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-[#2cb67d]">
        {title}
      </h3>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
        <div className="flex-1">
          {showLanguageLabel && (
            <label htmlFor="languageSelect" className="block text-sm font-medium text-[#e0e7ef] mb-2">
              Select Target Language:
            </label>
          )}
          <select
            id="languageSelect"
            className="shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#23272f] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0]"
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            disabled={disabled || translating}
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
            className={`bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 flex items-center gap-2 ${
              !selectedLanguage || translating || disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={handleTranslate}
            disabled={!selectedLanguage || translating || disabled}
          >
            {translating && <ButtonSpinner />}
            {translating ? "Translating..." : "Translate"}
          </button>
        </div>
      </div>

      {/* Translation Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Translated Text */}
      {translatedText && (
        <div className="bg-[#23272f] border border-[#2cb67d] rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-[#2cb67d]">
            Translated Text ({getLanguageName(selectedLanguage)})
          </h4>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-[#e0e7ef] leading-relaxed">
              {translatedText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

TranslationSection.propTypes = {
  textToTranslate: PropTypes.string.isRequired,
  onTranslationComplete: PropTypes.func,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  title: PropTypes.string,
  className: PropTypes.string,
  showLanguageLabel: PropTypes.bool
};

export default TranslationSection;
export { getLanguageName };
