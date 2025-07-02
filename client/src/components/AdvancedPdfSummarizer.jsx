import React, { useState } from 'react';
import axios from 'axios';
import SimplifiedSummarizationControls from './SimplifiedSummarizationControls';
import AdvancedSummaryDisplay from './AdvancedSummaryDisplay';
import { ButtonSpinner } from './Spinner';

const AdvancedPdfSummarizer = () => {
  // State for summarization options
  const [summaryType, setSummaryType] = useState('detailed');
  const [summaryMethod, setSummaryMethod] = useState('abstractive');
  const [showComparison, setShowComparison] = useState(false);
  
  // State for PDF upload and processing
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ step: '', progress: 0 });

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      setError('Please select only PDF files');
      return;
    }
    
    if (pdfFiles.length > 10) {
      setError('Maximum 10 PDF files allowed');
      return;
    }
    
    setSelectedFiles(pdfFiles);
    setError('');
  };

  // Remove file from selection
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  // Handle advanced summarization
  const handleAdvancedSummarization = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setComparisonResults(null);
    
    try {
      setLoadingProgress({ step: 'Uploading and processing PDFs...', progress: 20 });
      
      // Process each PDF file
      const summaries = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setLoadingProgress({ 
          step: `Processing ${file.name} (${i + 1}/${selectedFiles.length})...`, 
          progress: 20 + (i * 60 / selectedFiles.length) 
        });
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Use backend proxy instead of direct ML service
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/ml/summarize`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000 // 2 minutes per file
          }
        );
        
        // Check if this is a fallback response
        if (response.data.message && response.data.message.includes("Fallback response")) {
          // Show less intrusive fallback mode notification
          const fallbackNotification = document.createElement('div');
          fallbackNotification.className = 'fixed top-4 right-4 bg-amber-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
          fallbackNotification.innerHTML = `
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium">Demo Mode Active</h3>
                <p class="text-xs text-amber-200 mt-1">Using sample data - ML service unavailable</p>
              </div>
              <button class="ml-4 text-amber-300 hover:text-white" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
          `;
          document.body.appendChild(fallbackNotification);
          setTimeout(() => {
            if (fallbackNotification.parentNode) {
              fallbackNotification.parentNode.removeChild(fallbackNotification);
            }
          }, 8000);
        }
        
        if (response.data && response.data.summary) {
          summaries.push({
            fileName: file.name,
            summary: response.data.summary,
            fileSize: file.size,
            metadata: response.data.summary.metadata || {}
          });
        }
      }
      
      setLoadingProgress({ step: 'Creating enhanced summary...', progress: 85 });
      
      // Create enhanced result based on user selections
      const enhancedResult = {
        summary: formatSummaryByType(summaries, summaryType, summaryMethod),
        method: summaryMethod,
        level: summaryType,
        word_count: calculateWordCount(summaries),
        files_processed: summaries.length,
        processing_info: {
          model_used: 'existing-ml-service',
          enhancement_applied: true,
          files_count: selectedFiles.length,
          total_size: selectedFiles.reduce((acc, file) => acc + file.size, 0)
        },
        individual_summaries: summaries
      };
      
      setResults(enhancedResult);
      setLoadingProgress({ step: 'Complete!', progress: 100 });
      
    } catch (err) {
      console.error('Error in advanced PDF summarization:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Summarization failed';
      setError(`Failed to process PDFs: ${errorMessage}`);
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingProgress({ step: '', progress: 0 }), 2000);
    }
  };

  // Format summary based on selected type and method
  const formatSummaryByType = (summaries, type, method) => {
    const combinedText = summaries.map(s => `**${s.fileName}:**\n${s.summary}`).join('\n\n');
    
    if (type === 'concise') {
      return extractKeyPoints(combinedText);
    } else if (type === 'executive') {
      return formatExecutiveSummary(combinedText);
    } else if (method === 'extractive') {
      return extractKeySentences(combinedText);
    }
    
    return combinedText; // Default detailed format
  };

  const extractKeyPoints = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPoints = sentences.slice(0, Math.min(8, sentences.length));
    return keyPoints.map(point => `• ${point.trim()}`).join('\n');
  };

  const formatExecutiveSummary = (text) => {
    return `**Executive Summary:**\n\n${extractKeyPoints(text)}\n\n**Key Insights:**\n• Business impact assessment needed\n• Legal compliance review recommended\n• Strategic decision points identified`;
  };

  const extractKeySentences = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    // Simple scoring: prefer sentences with legal keywords
    const legalKeywords = ['court', 'legal', 'case', 'ruling', 'decision', 'evidence', 'law'];
    const scored = sentences.map(sentence => ({
      text: sentence.trim(),
      score: legalKeywords.reduce((score, keyword) => 
        score + (sentence.toLowerCase().includes(keyword) ? 1 : 0), 0)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map(item => `"${item.text}"`).join('\n\n');
  };

  const calculateWordCount = (summaries) => {
    return summaries.reduce((acc, summary) => {
      const words = summary.summary.toString().split(/\s+/).length;
      return acc + words;
    }, 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🚀 Advanced PDF Summarizer
          </h1>
          <p className="text-gray-400 text-lg">
            Upload multiple PDFs and get intelligent summaries with customizable analysis methods
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">📁</span>
            Upload PDF Files
          </h2>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-medium
                       file:bg-blue-500 file:text-white
                       hover:file:bg-blue-600
                       file:cursor-pointer cursor-pointer"
            />
            <p className="text-gray-500 text-sm mt-2">
              Select up to 10 PDF files (Max file size: 10MB each)
            </p>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Selected Files ({selectedFiles.length}):</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div className="flex items-center">
                      <span className="mr-3">📄</span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summarization Controls */}
        <SimplifiedSummarizationControls
          summaryType={summaryType}
          setSummaryType={setSummaryType}
          method={summaryMethod}
          setMethod={setSummaryMethod}
          showComparison={showComparison}
          setShowComparison={setShowComparison}
          disabled={loading}
        />

        {/* Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleAdvancedSummarization}
            disabled={loading || selectedFiles.length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                     disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                     text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300
                     transform hover:scale-105 disabled:transform-none shadow-lg"
          >
            {loading ? (
              <div className="flex items-center">
                <ButtonSpinner />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Generate Advanced Summary
              </>
            )}
          </button>
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-4"></div>
              <div>
                <h3 className="font-bold">Processing...</h3>
                <p className="text-gray-400">{loadingProgress.step}</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-6">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mb-8">
            <AdvancedSummaryDisplay 
              summaryData={results} 
              isComparison={false} 
            />
          </div>
        )}

        {/* Individual File Summaries with Enhanced Display */}
        {results && results.individual_summaries && (
          <div className="space-y-6">
            {results.individual_summaries.map((item, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700">
                {/* File Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <span className="mr-2">📄</span>
                      {item.fileName}
                    </h3>
                    {item.metadata && (
                      <div className="text-sm text-gray-400 space-x-4">
                        {item.metadata.word_count && (
                          <span>� {item.metadata.word_count} words</span>
                        )}
                        {item.metadata.page_count && (
                          <span>📜 {item.metadata.page_count} pages</span>
                        )}
                        {item.metadata.confidence_score && (
                          <span>🎯 {Math.round(item.metadata.confidence_score * 100)}% confidence</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Content */}
                <div className="p-6">
                  {/* Check if summary has structured format */}
                  {typeof item.summary === 'object' && item.summary.executive_summary ? (
                    <div className="space-y-6">
                      {/* Executive Summary */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="text-lg font-bold text-blue-300 mb-3 flex items-center">
                          <span className="mr-2">⭐</span>
                          Executive Summary
                        </h4>
                        <p className="text-gray-300 leading-relaxed">
                          {item.summary.executive_summary}
                        </p>
                      </div>

                      {/* Key Findings */}
                      {item.summary.key_findings && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center">
                            <span className="mr-2">🔍</span>
                            Key Findings
                          </h4>
                          <ul className="space-y-2">
                            {item.summary.key_findings.map((finding, idx) => (
                              <li key={idx} className="text-gray-300 flex items-start">
                                <span className="text-green-400 mr-2 mt-1">•</span>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dual Summary Approach */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Abstractive Summary */}
                        {item.summary.abstractive_summary && (
                          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
                              <span className="mr-2">🧠</span>
                              Abstractive Summary
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {item.summary.abstractive_summary}
                            </p>
                          </div>
                        )}

                        {/* Extractive Summary */}
                        {item.summary.extractive_summary && (
                          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-orange-300 mb-3 flex items-center">
                              <span className="mr-2">📋</span>
                              Extractive Summary
                            </h4>
                            <div className="space-y-2">
                              {item.summary.extractive_summary.map((extract, idx) => (
                                <div key={idx} className="text-gray-300 text-sm italic border-l-2 border-orange-500/50 pl-3">
                                  "{extract}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed Analysis */}
                      {item.summary.detailed_analysis && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-yellow-300 mb-3 flex items-center">
                            <span className="mr-2">📚</span>
                            Detailed Analysis
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {Object.entries(item.summary.detailed_analysis).map(([section, content]) => (
                              <div key={section} className="space-y-2">
                                <h5 className="font-medium text-yellow-200 capitalize">
                                  {section.replace(/_/g, ' ')}:
                                </h5>
                                <p className="text-gray-300 leading-relaxed">
                                  {content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback for simple string summaries */
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {typeof item.summary === 'string' ? item.summary : JSON.stringify(item.summary, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPdfSummarizer;
