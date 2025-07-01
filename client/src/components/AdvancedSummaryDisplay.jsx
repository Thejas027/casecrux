import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AdvancedSummaryDisplay = ({ summaryData, isComparison = false }) => {
  const [activeTab, setActiveTab] = useState(isComparison ? 'comparison' : 'summary');
  const [expandedMethod, setExpandedMethod] = useState('hybrid');

  if (!summaryData) {
    return null;
  }

  // Handle comparison mode
  if (isComparison && summaryData.comparison_results) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {/* Comparison Header */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">🔍</span>
            Summary Comparison
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Compare different summarization methods for the same content
          </p>
        </div>

        {/* Method Selector */}
        <div className="p-4 bg-gray-750 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(summaryData.comparison_results).map(([method, data]) => (
              <button
                key={method}
                onClick={() => setExpandedMethod(method)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  expandedMethod === method
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {method === 'abstractive' && '🧠'} 
                {method === 'extractive' && '📋'} 
                {method === 'hybrid' && '⚡'} 
                {method.charAt(0).toUpperCase() + method.slice(1)}
                <span className="ml-2 text-xs opacity-70">
                  ({data.word_count} words)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Analysis */}
        <div className="p-4 bg-gray-750 border-b border-gray-700">
          <h4 className="font-semibold text-white mb-2">📊 Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-gray-400">Source Length</div>
              <div className="text-white font-mono">
                {summaryData.analysis?.total_source_words?.toLocaleString()} words
              </div>
            </div>
            {summaryData.analysis?.compression_ratios && Object.entries(summaryData.analysis.compression_ratios).map(([method, ratio]) => (
              <div key={method} className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 capitalize">{method} Ratio</div>
                <div className="text-white font-mono">{ratio}:1</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Method Content */}
        <div className="p-6">
          {summaryData.comparison_results[expandedMethod] && (
            <AdvancedSummaryContent 
              data={summaryData.comparison_results[expandedMethod]} 
            />
          )}
        </div>
      </div>
    );
  }

  // Handle single summary mode
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Summary Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">📋</span>
            Summary Results
          </h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
              {summaryData.level?.charAt(0).toUpperCase() + summaryData.level?.slice(1)}
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm">
              {summaryData.method?.charAt(0).toUpperCase() + summaryData.method?.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📄 Summary
          </button>
          {summaryData.key_sentences && (
            <button
              onClick={() => setActiveTab('extracts')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'extracts'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🔑 Key Extracts
            </button>
          )}
          {summaryData.key_phrases && (
            <button
              onClick={() => setActiveTab('phrases')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'phrases'
                  ? 'border-b-2 border-blue-500 text-blue-400'  
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              🏷️ Key Terms
            </button>
          )}
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'metadata'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📊 Details
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <AdvancedSummaryContent data={summaryData} />
        )}
        
        {activeTab === 'extracts' && summaryData.key_sentences && (
          <div>
            <h4 className="font-semibold text-white mb-4">🔑 Key Extracted Sentences</h4>
            <div className="space-y-3">
              {summaryData.key_sentences.map((sentence, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <span className="bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-gray-300 leading-relaxed">{sentence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'phrases' && summaryData.key_phrases && (
          <div>
            <h4 className="font-semibold text-white mb-4">🏷️ Key Terms and Phrases</h4>
            <div className="flex flex-wrap gap-2">
              {summaryData.key_phrases.map((phrase, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'metadata' && (
          <div>
            <h4 className="font-semibold text-white mb-4">📊 Processing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-300 mb-2">Summary Statistics</h5>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>Word Count: <span className="text-white font-mono">{summaryData.word_count}</span></li>
                  <li>Method: <span className="text-white capitalize">{summaryData.method}</span></li>
                  <li>Level: <span className="text-white capitalize">{summaryData.level}</span></li>
                </ul>
              </div>
              
              {summaryData.processing_info && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-300 mb-2">Processing Info</h5>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {Object.entries(summaryData.processing_info).map(([key, value]) => (
                      <li key={key}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:{' '}
                        <span className="text-white font-mono">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdvancedSummaryContent = ({ data }) => {
  if (!data || !data.summary) {
    return (
      <div className="text-gray-400 text-center py-8">
        No summary content available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-gray-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: data.summary.replace(/\n/g, '<br>') 
            }}
          />
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="bg-gray-700 rounded px-3 py-1">
          <span className="text-gray-400">Words:</span>{' '}
          <span className="text-white font-mono">{data.word_count}</span>
        </div>
        <div className="bg-gray-700 rounded px-3 py-1">
          <span className="text-gray-400">Method:</span>{' '}
          <span className="text-white capitalize">{data.method}</span>
        </div>
        {data.level && (
          <div className="bg-gray-700 rounded px-3 py-1">
            <span className="text-gray-400">Level:</span>{' '}
            <span className="text-white capitalize">{data.level}</span>
          </div>
        )}
      </div>
    </div>
  );
};

AdvancedSummaryDisplay.propTypes = {
  summaryData: PropTypes.object,
  isComparison: PropTypes.bool
};

AdvancedSummaryContent.propTypes = {
  data: PropTypes.object.isRequired
};

export default AdvancedSummaryDisplay;
