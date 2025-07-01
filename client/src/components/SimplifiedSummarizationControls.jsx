import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SimplifiedSummarizationControls = ({ 
  summaryType, 
  setSummaryType, 
  method, 
  setMethod, 
  showComparison, 
  setShowComparison,
  disabled = false 
}) => {
  // Simplified options that work with existing ML service
  const summaryOptions = {
    summary_types: {
      detailed: { name: "Detailed Analysis", icon: "📄", description: "Comprehensive analysis" },
      concise: { name: "Concise Summary", icon: "📝", description: "Key points only" },
      executive: { name: "Executive Summary", icon: "👔", description: "Business-focused" }
    },
    methods: {
      abstractive: { name: "AI Generated", icon: "🧠", description: "AI creates interpretive text" },
      extractive: { name: "Key Extracts", icon: "📋", description: "Important sentences from source" }
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(summaryOptions.summary_types).map(([key, option]) => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Analysis Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(summaryOptions.methods).map(([key, option]) => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Selected Options Summary */}
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Current Selection:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
            {summaryOptions.summary_types[summaryType]?.icon} {summaryOptions.summary_types[summaryType]?.name}
          </span>
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
            {summaryOptions.methods[method]?.icon} {summaryOptions.methods[method]?.name}
          </span>
        </div>
      </div>

      {/* Note about using existing ML service */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-300 text-sm">
          <span className="mr-2">💡</span>
          <strong>Note:</strong> Currently using the existing ML service. Advanced features will be enhanced when the new ML endpoints are deployed.
        </p>
      </div>
    </div>
  );
};

SimplifiedSummarizationControls.propTypes = {
  summaryType: PropTypes.string.isRequired,
  setSummaryType: PropTypes.func.isRequired,
  method: PropTypes.string.isRequired,
  setMethod: PropTypes.func.isRequired,
  showComparison: PropTypes.bool.isRequired,
  setShowComparison: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default SimplifiedSummarizationControls;
