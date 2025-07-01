import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SummarizationControls = ({ 
  summaryType, 
  setSummaryType, 
  method, 
  setMethod, 
  showComparison, 
  setShowComparison,
  disabled = false 
}) => {
  const [summaryOptions, setSummaryOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch summary options from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_ML_BACKEND_URL}/summary_options`);
        if (response.ok) {
          const data = await response.json();
          setSummaryOptions(data);
        }
      } catch (error) {
        console.error('Failed to fetch summary options:', error);
        // Fallback options
        setSummaryOptions({
          summary_types: {
            detailed: { name: "Detailed Analysis", icon: "📄", description: "Comprehensive analysis" },
            concise: { name: "Concise Summary", icon: "📝", description: "Key points only" },
            executive: { name: "Executive Summary", icon: "👔", description: "Business-focused" },
            technical: { name: "Technical Legal", icon: "⚖️", description: "Legal expert analysis" },
            bullets: { name: "Bullet Points", icon: "🔸", description: "Scannable format" }
          },
          methods: {
            abstractive: { name: "AI Generated", icon: "🧠", description: "AI creates interpretive text" },
            extractive: { name: "Direct Quotes", icon: "📋", description: "Exact sentences from source" },
            hybrid: { name: "Best of Both", icon: "⚡", description: "Combines both approaches" }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="mr-2">⚙️</span>
        Summarization Options
      </h3>

      {/* Summary Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Summary Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {summaryOptions?.summary_types && Object.entries(summaryOptions.summary_types).map(([key, option]) => (
            <button
              key={key}
              onClick={() => setSummaryType(key)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                summaryType === key
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{option.icon}</span>
                <span className="font-medium">{option.name}</span>
              </div>
              <p className="text-xs text-gray-400">{option.description}</p>
              {option.estimated_length && (
                <p className="text-xs text-gray-500 mt-1">{option.estimated_length}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Summarization Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summaryOptions?.methods && Object.entries(summaryOptions.methods).map(([key, option]) => (
            <button
              key={key}
              onClick={() => setMethod(key)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                method === key
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{option.icon}</span>
                <span className="font-medium">{option.name}</span>
              </div>
              <p className="text-xs text-gray-400">{option.description}</p>
              {option.pros && (
                <div className="mt-2">
                  <p className="text-xs text-green-400 font-medium">Pros:</p>
                  <ul className="text-xs text-gray-400 list-disc list-inside">
                    {option.pros.slice(0, 2).map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                disabled={disabled}
                className="mr-2 rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="mr-2">🔍</span>
              Generate comparison (all methods)
            </label>
            <p className="text-xs text-gray-400 ml-6">
              Creates abstractive, extractive, and hybrid summaries for comparison
            </p>
          </div>
        </div>
      </div>

      {/* Selected Options Summary */}
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Current Selection:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
            {summaryOptions?.summary_types[summaryType]?.icon} {summaryOptions?.summary_types[summaryType]?.name}
          </span>
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
            {summaryOptions?.methods[method]?.icon} {summaryOptions?.methods[method]?.name}
          </span>
          {showComparison && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
              🔍 Comparison Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

SummarizationControls.propTypes = {
  summaryType: PropTypes.string.isRequired,
  setSummaryType: PropTypes.func.isRequired,
  method: PropTypes.string.isRequired,
  setMethod: PropTypes.func.isRequired,
  showComparison: PropTypes.bool.isRequired,
  setShowComparison: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default SummarizationControls;
