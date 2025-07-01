/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { ButtonSpinner, InlineSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CategoryBatchPdfSummarizer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg">
          <h3 className="font-bold">Something went wrong displaying the summary</h3>
          <p className="mt-2">Error: {this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function CategoryBatchPdfSummarizer({ onSummaryUpdate, onTranslationUpdate }) {
  const [category, setCategory] = useState("");
  const [searchMode, setSearchMode] = useState("instant"); // "instant" or "advanced"
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfCount, setPdfCount] = useState(0);
  const [savingToHistory, setSavingToHistory] = useState(false);

  // Enhanced UX state
  const [recentCategories, setRecentCategories] = useState([]);
  const [favoriteCategories, setFavoriteCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ step: "", progress: 0 });
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Enhanced error handling state
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showCategoryDiscovery, setShowCategoryDiscovery] = useState(false);

  // Load saved data from localStorage on component mount
  React.useEffect(() => {
    const savedRecent = localStorage.getItem('casecrux-recent-categories');
    const savedFavorites = localStorage.getItem('casecrux-favorite-categories');
    const savedHistory = localStorage.getItem('casecrux-search-history');
    
    if (savedRecent) {
      setRecentCategories(JSON.parse(savedRecent));
    }
    if (savedFavorites) {
      setFavoriteCategories(JSON.parse(savedFavorites));
    }
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to recent categories when a search is performed
  const addToRecentCategories = (cat) => {
    const updated = [cat, ...recentCategories.filter(c => c !== cat)].slice(0, 10);
    setRecentCategories(updated);
    localStorage.setItem('casecrux-recent-categories', JSON.stringify(updated));
  };

  // Add to search history with timestamp
  const addToSearchHistory = (cat, success, resultCount = 0) => {
    const entry = {
      category: cat,
      timestamp: new Date().toISOString(),
      success,
      resultCount
    };
    const updated = [entry, ...searchHistory].slice(0, 20);
    setSearchHistory(updated);
    localStorage.setItem('casecrux-search-history', JSON.stringify(updated));
  };

  // Toggle favorite categories
  const toggleFavoriteCategory = (cat) => {
    const updated = favoriteCategories.includes(cat)
      ? favoriteCategories.filter(c => c !== cat)
      : [...favoriteCategories, cat].slice(0, 10);
    setFavoriteCategories(updated);
    localStorage.setItem('casecrux-favorite-categories', JSON.stringify(updated));
  };

  // Get filtered suggestions based on input
  const getSuggestions = () => {
    if (!category.trim()) return [...favoriteCategories, ...recentCategories].slice(0, 8);
    
    const allSuggestions = [...favoriteCategories, ...recentCategories, ...searchHistory.map(h => h.category)];
    const filtered = allSuggestions.filter(cat => 
      cat.toLowerCase().includes(category.toLowerCase())
    );
    return [...new Set(filtered)].slice(0, 6);
  };

  // Fetch all available categories from the database
  const fetchAllAvailableCategories = async () => {
    try {
      setLoadingProgress({ step: "Finding all available categories...", progress: 30 });
      
      // Get all uploaded PDFs to extract unique categories
      const response = await axios.get(`${BACKEND_URL}/api/all-categories`);
      
      if (response.data && response.data.categories) {
        const categories = response.data.categories.filter(cat => cat && cat.trim());
        setAvailableCategories(categories);
        return categories;
      } else {
        // Fallback: try to get from batch summary history
        const historyResponse = await axios.get(`${BACKEND_URL}/api/batch-summary-history`);
        if (historyResponse.data && historyResponse.data.history) {
          const categoriesFromHistory = [...new Set(
            historyResponse.data.history
              .map(item => item.category)
              .filter(cat => cat && cat.trim())
          )];
          setAvailableCategories(categoriesFromHistory);
          return categoriesFromHistory;
        }
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching available categories:', err);
      // Return categories from local storage as fallback
      const localCategories = [...new Set([...recentCategories, ...favoriteCategories])];
      setAvailableCategories(localCategories);
      return localCategories;
    }
  };

  // Instant Search & Summarize - One-click solution with enhanced progress tracking
  const handleInstantSummarize = async (e) => {
    e.preventDefault();
    if (!category.trim()) {
      setError("Please enter a category name.");
      return;
    }
    
    console.log('Starting instant summarize for category:', category);
    
    setLoading(true);
    setError("");
    setShowCategoryDiscovery(false); // Reset category discovery
    setPdfs([]);
    setSelectedPdfs([]);
    setSummaries([]);
    setOverallSummary(null);
    setPdfCount(0);
    setLoadingProgress({ step: "Initializing search...", progress: 10 });
    
    try {
      setLoadingProgress({ step: "Searching for PDFs in category...", progress: 20 });
      console.log('Fetching PDFs for category:', category);
      // First, get all PDFs in the category
      const listResponse = await axios.post(
        `${BACKEND_URL}/api/list-uploaded-pdfs-by-category`,
        { category }
      );
      
      const foundPdfs = listResponse.data.files || [];
      console.log('Found PDFs:', foundPdfs.length);
      setPdfs(foundPdfs);
      setPdfCount(foundPdfs.length);
      
      if (foundPdfs.length === 0) {
        console.log('No PDFs found, fetching available categories for user guidance');
        
        // Fetch all available categories to help the user
        const availableCats = await fetchAllAvailableCategories();
        
        if (availableCats.length > 0) {
          setShowCategoryDiscovery(true);
          setError(`No PDFs found in category "${category}". Choose from available categories below:`);
        } else {
          setError(`No PDFs found in category "${category}". Please check the category name or upload some PDFs first.`);
        }
        
        addToSearchHistory(category, false, 0);
        setLoadingProgress({ step: "", progress: 0 });
        return;
      }
      
      setLoadingProgress({ step: `Found ${foundPdfs.length} PDFs. Starting analysis...`, progress: 40 });
      
      // Automatically select all PDFs and summarize them
      const allUrls = foundPdfs.map(pdf => pdf.url);
      setSelectedPdfs(allUrls);
      
      console.log('Starting summarization of', allUrls.length, 'PDFs');
      setLoadingProgress({ step: `Analyzing ${allUrls.length} legal documents...`, progress: 60 });
      
      // Immediately summarize all PDFs in the category
      const response = await axios.post(
        `${BACKEND_URL}/api/ml/summarize_from_urls`,
        { urls: allUrls }
      );
      
      console.log('Summarization response:', response.data);
      setLoadingProgress({ step: "Processing analysis results...", progress: 80 });
      
      if (response.data && response.data.overall_summary) {
        console.log('Setting overall summary:', response.data.overall_summary);
        setOverallSummary(response.data.overall_summary);
        // Call the callback if provided
        if (onSummaryUpdate) {
          onSummaryUpdate(response.data.overall_summary);
        }
        
        setLoadingProgress({ step: "Saving results to history...", progress: 90 });
        // Save summary to history
        await saveSummaryToHistory(response.data.overall_summary, foundPdfs, allUrls);
        
        // Add to search tracking
        addToRecentCategories(category);
        addToSearchHistory(category, true, foundPdfs.length);
        
        setLoadingProgress({ step: "Complete!", progress: 100 });
        console.log('Summary saved to history successfully');
      } else {
        console.error('No overall summary in response:', response.data);
        setError("No overall summary returned.");
        addToSearchHistory(category, false, foundPdfs.length);
      }
    } catch (err) {
      console.error('Error in instant summarize:', err);
      setError(err.response?.data?.error || "Failed to search and summarize PDFs.");
      addToSearchHistory(category, false, 0);
    } finally {
      setLoading(false);
      setLoadingProgress({ step: "", progress: 0 });
      console.log('Instant summarize completed');
    }
  };

  const handleListPdfs = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPdfs([]);
    setSelectedPdfs([]);
    setSummaries([]);
    setOverallSummary(null);
    setPdfCount(0);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/list-uploaded-pdfs-by-category`,
        { category }
      );
      const foundPdfs = response.data.files || [];
      setPdfs(foundPdfs);
      setPdfCount(foundPdfs.length);
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

  // Helper function to prepare summary text for translation
  const prepareSummaryForTranslation = (summary) => {
    if (!summary) return "";
    
    let text = "";
    if (summary.pros) text += `Pros:\n${summary.pros.join("\n")}`;
    if (summary.cons) text += `\n\nCons:\n${summary.cons.join("\n")}`;
    if (summary.final_judgment) text += `\n\nFinal Judgment:\n${summary.final_judgment}`;
    if (summary.raw) text += `\n${summary.raw}`;
    
    return text;
  };

  // Save summary to batch history
  const saveSummaryToHistory = async (summary, pdfList = null, urlList = null) => {
    setSavingToHistory(true);
    try {
      // Collect PDF names and URLs
      const pdfNames = [];
      const pdfUrls = [];
      
      if (pdfList && urlList) {
        // For instant summarize, we already have the data
        pdfList.forEach(pdf => {
          pdfNames.push(pdf.filename);
          pdfUrls.push(pdf.url);
        });
      } else {
        // For manual selection, match selected PDFs with their names
        selectedPdfs.forEach(selectedUrl => {
          const pdf = pdfs.find(p => p.url === selectedUrl);
          if (pdf) {
            pdfNames.push(pdf.filename);
            pdfUrls.push(pdf.url);
          }
        });
      }
      
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-4 tracking-wider text-white">
          CaseCrux
        </h1>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#7f5af0] mb-2">
            Smart Category Case Analyzer
          </h2>
          <p className="text-[#a786df] text-lg">
            Get instant summaries of all cases in a category
          </p>
        </div>
        
        {/* Enhanced Search Form with Suggestions */}
        <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]">
          <div className="mb-6">
            <label
              htmlFor="category-input"
              className="block text-[#e0e7ef] text-xl font-bold mb-3 flex items-center gap-2"
            >
              🔍 Search Category:
              {favoriteCategories.includes(category) && (
                <span className="text-yellow-400 text-sm">⭐ Favorite</span>
              )}
            </label>
            <div className="relative">
              <input
                id="category-input"
                type="text"
                placeholder="e.g., murder, robbery, fraud, assault..."
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInstantSummarize(e);
                  }
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg w-full py-4 px-4 text-[#e0e7ef] placeholder-[#a786df] leading-tight focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] text-lg transition-all duration-150"
                required
              />
              
              {/* Category Suggestions Dropdown */}
              {showSuggestions && (favoriteCategories.length > 0 || recentCategories.length > 0 || category.trim()) && (
                <div className="absolute top-full left-0 right-0 bg-[#18181b] border-2 border-[#7f5af0] rounded-lg mt-2 max-h-60 overflow-y-auto z-50 shadow-2xl">
                  {/* Favorites Section */}
                  {favoriteCategories.length > 0 && !category.trim() && (
                    <div className="p-3 border-b border-[#7f5af0]/30">
                      <div className="text-xs font-semibold text-yellow-400 mb-2">⭐ FAVORITES</div>
                      {favoriteCategories.map(cat => (
                        <button
                          key={`fav-${cat}`}
                          className="block w-full text-left px-3 py-2 hover:bg-[#23272f] text-[#e0e7ef] rounded transition-colors"
                          onClick={() => {
                            setCategory(cat);
                            setShowSuggestions(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Recent Categories */}
                  {recentCategories.length > 0 && !category.trim() && (
                    <div className="p-3 border-b border-[#7f5af0]/30">
                      <div className="text-xs font-semibold text-[#2cb67d] mb-2">🕐 RECENT</div>
                      {recentCategories.slice(0, 5).map(cat => (
                        <button
                          key={`recent-${cat}`}
                          className="block w-full text-left px-3 py-2 hover:bg-[#23272f] text-[#e0e7ef] rounded transition-colors"
                          onClick={() => {
                            setCategory(cat);
                            setShowSuggestions(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Filtered Suggestions */}
                  {category.trim() && getSuggestions().length > 0 && (
                    <div className="p-3">
                      <div className="text-xs font-semibold text-[#a786df] mb-2">💡 SUGGESTIONS</div>
                      {getSuggestions().map(cat => (
                        <button
                          key={`suggestion-${cat}`}
                          className="block w-full text-left px-3 py-2 hover:bg-[#23272f] text-[#e0e7ef] rounded transition-colors"
                          onClick={() => {
                            setCategory(cat);
                            setShowSuggestions(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  {category.trim() && (
                    <div className="p-3 border-t border-[#7f5af0]/30">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[#23272f] text-yellow-400 rounded transition-colors text-sm"
                        onClick={() => {
                          toggleFavoriteCategory(category);
                          setShowSuggestions(false);
                        }}
                      >
                        {favoriteCategories.includes(category) ? '★ Remove from Favorites' : '☆ Add to Favorites'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-[#a786df]">
                💡 Enter a case category to get an instant summary of all related cases
              </p>
              <div className="flex items-center gap-2 text-xs text-[#a786df]">
                <span>Press Enter to search</span>
                <span>•</span>
                <span>Esc to close suggestions</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary Action - Instant Search & Summarize */}
            <button
              onClick={handleInstantSummarize}
              disabled={loading || !category.trim()}
              className={`bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-bold py-4 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 transform hover:scale-105 ${
                loading || !category.trim() ? "opacity-50 cursor-not-allowed transform-none" : ""
              }`}
            >
              {loading ? (
                <>
                  <ButtonSpinner />
                  <span>{loadingProgress.step || "Analyzing Cases..."}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                  </svg>
                  <span>🚀 Instant Analysis</span>
                </>
              )}
            </button>

            {/* Secondary Action - Advanced Mode */}
            <button
              onClick={handleListPdfs}
              disabled={loading || !category.trim()}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#a786df] hover:from-[#a786df] hover:to-[#7f5af0] text-white font-semibold py-4 px-6 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                loading || !category.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
              </svg>
              Advanced Selection
            </button>
          </div>
          
          {/* Progress Bar */}
          {loading && loadingProgress.progress > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#a786df]">{loadingProgress.step}</span>
                <span className="text-sm text-[#2cb67d]">{loadingProgress.progress}%</span>
              </div>
              <div className="w-full bg-[#18181b] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Info */}
          {pdfCount > 0 && !loading && (
            <div className="mt-4 p-3 bg-[#18181b] rounded-lg border border-[#2cb67d]">
              <p className="text-[#2cb67d] text-center font-semibold">
                📊 Found {pdfCount} cases in "{category}" category
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Bar */}
        {(recentCategories.length > 0 || favoriteCategories.length > 0) && !loading && (
          <div className="bg-[#23272f] shadow-lg rounded-xl px-6 py-4 mb-6 border border-[#7f5af0]/30">
            <div className="flex flex-wrap items-center gap-4">
              {/* Favorites */}
              {favoriteCategories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-yellow-400">⭐ Favorites:</span>
                  <div className="flex gap-2">
                    {favoriteCategories.slice(0, 3).map(cat => (
                      <button
                        key={`quick-fav-${cat}`}
                        onClick={() => setCategory(cat)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1 rounded-full text-sm transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent */}
              {recentCategories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2cb67d]">🕐 Recent:</span>
                  <div className="flex gap-2">
                    {recentCategories.slice(0, 3).map(cat => (
                      <button
                        key={`quick-recent-${cat}`}
                        onClick={() => setCategory(cat)}
                        className="bg-[#2cb67d]/20 hover:bg-[#2cb67d]/30 text-[#2cb67d] px-3 py-1 rounded-full text-sm transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Clear History */}
              <button
                onClick={() => {
                  setRecentCategories([]);
                  setSearchHistory([]);
                  localStorage.removeItem('casecrux-recent-categories');
                  localStorage.removeItem('casecrux-search-history');
                }}
                className="ml-auto text-xs text-[#a786df] hover:text-red-400 transition-colors"
                title="Clear search history"
              >
                🗑️ Clear History
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Error Display with Category Discovery */}
        {error && (
          <div className="mb-4">
            <div
              className="bg-[#2cb67d] border border-[#7f5af0] text-[#18181b] px-4 py-3 rounded relative text-lg"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
            
            {/* Category Discovery Section */}
            {showCategoryDiscovery && availableCategories.length > 0 && (
              <div className="bg-[#23272f] shadow-xl rounded-xl px-6 py-6 mt-4 border-2 border-yellow-500/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                    💡 Available Categories ({availableCategories.length})
                  </h3>
                  <button
                    onClick={() => {
                      setShowCategoryDiscovery(false);
                      setError("");
                    }}
                    className="text-[#a786df] hover:text-white transition-colors"
                    title="Close category discovery"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-[#a786df] mb-4 text-sm">
                  Here are all the categories that contain legal cases. Click on any category to analyze it:
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                  {availableCategories.map((cat, index) => (
                    <button
                      key={`available-${cat}-${index}`}
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDiscovery(false);
                        setError("");
                        // Auto-trigger search after selection
                        setTimeout(() => {
                          handleInstantSummarize({ preventDefault: () => {} });
                        }, 100);
                      }}
                      className="bg-[#18181b] hover:bg-[#2cb67d] border border-[#7f5af0] hover:border-[#2cb67d] text-[#e0e7ef] hover:text-[#18181b] px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left font-medium transform hover:scale-105"
                    >
                      📁 {cat}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-[#18181b] rounded-lg border border-[#7f5af0]/30">
                  <p className="text-xs text-[#a786df] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM5.354 4.646a.5.5 0 1 1 .708-.708L8 5.877l1.938-1.939a.5.5 0 1 1 .708.708L8.707 6.585a1 1 0 0 1-1.414 0L5.354 4.646z"/>
                    </svg>
                    💡 Tip: You can also add any of these categories to your favorites by clicking the star icon when typing
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced PDF Selection - Only show when explicitly requested */}
        {pdfs.length > 0 && !overallSummary && (
          <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#2cb67d]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#2cb67d]">
                📋 Advanced Selection Mode
              </h3>
              <span className="text-sm text-[#a786df]">
                {selectedPdfs.length} of {pdfs.length} selected
              </span>
            </div>
            
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setSelectedPdfs(pdfs.map(p => p.url))}
                className="bg-[#2cb67d] hover:bg-[#7f5af0] text-white px-4 py-2 rounded-lg text-sm transition-colors duration-150"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedPdfs([])}
                className="bg-[#7f5af0] hover:bg-[#2cb67d] text-white px-4 py-2 rounded-lg text-sm transition-colors duration-150"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {pdfs.map((pdf) => (
                <div key={pdf.public_id} className="bg-[#18181b] border border-[#7f5af0] rounded-lg p-4 flex items-center hover:border-[#2cb67d] transition-colors duration-150">
                  <input
                    type="checkbox"
                    className="mr-4 w-5 h-5 text-[#7f5af0] bg-[#18181b] border-[#7f5af0] rounded focus:ring-[#7f5af0] focus:ring-2"
                    checked={selectedPdfs.includes(pdf.url)}
                    onChange={() => handleSelectPdf(pdf.url)}
                    id={pdf.public_id}
                  />
                  <label
                    htmlFor={pdf.public_id}
                    className="flex-1 cursor-pointer text-[#e0e7ef] text-lg hover:text-[#2cb67d] transition-colors duration-150"
                  >
                    📄 {pdf.filename}
                  </label>
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-[#7f5af0] hover:text-[#2cb67d] text-sm underline transition-colors duration-150 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                      <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                    </svg>
                    Preview
                  </a>
                </div>
              ))}
            </div>
            <button
              onClick={handleSummarizeSelected}
              disabled={loading || savingToHistory || selectedPdfs.length === 0}
              className={`w-full bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-bold py-4 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105 ${
                loading || savingToHistory || selectedPdfs.length === 0 ? "opacity-50 cursor-not-allowed transform-none" : "cursor-pointer"
              }`}
            >
              {(loading || savingToHistory) && <ButtonSpinner />}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
              </svg>
              {loading 
                ? "Analyzing Selected Cases..." 
                : savingToHistory 
                  ? "Saving Analysis..." 
                  : `Analyze ${selectedPdfs.length} Selected Cases`
              }
            </button>
          </div>
        )}

        {/* Summary Display */}
        {overallSummary && typeof overallSummary === 'object' && (
          <ErrorBoundary>
            <div className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-[#7f5af0] flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                  <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                </svg>
                📊 "{category}" Case Analysis
              </h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-[#a786df] bg-[#18181b] px-3 py-1 rounded-lg">
                  {pdfCount} cases analyzed
                </div>
                <button
                  onClick={() => {
                    try {
                      let content = `Category: ${category}\nCases Analyzed: ${pdfCount}\nGenerated: ${new Date().toLocaleString()}\n\n`;
                      if (overallSummary.pros && Array.isArray(overallSummary.pros)) content += `✅ PROS:\n${overallSummary.pros.join("\n")}\n\n`;
                      if (overallSummary.cons && Array.isArray(overallSummary.cons)) content += `❌ CONS:\n${overallSummary.cons.join("\n")}\n\n`;
                      if (overallSummary.final_judgment) content += `⚖️ FINAL JUDGMENT:\n${overallSummary.final_judgment}\n\n`;
                      if (overallSummary.raw) content += `📋 DETAILED ANALYSIS:\n${overallSummary.raw}`;
                      
                      const blob = new Blob([content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${category}-case-analysis-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Download error:', err);
                      setError('Failed to download analysis');
                    }
                  }}
                  className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="Download Complete Analysis"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                  </svg>
                  Download Analysis
                </button>
              </div>
            </div>

            {/* Original Summary Content */}
            <div className="bg-[#18181b] border border-[#7f5af0] rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#7f5af0" }}>
                Original Summary (English)
              </h4>
              <div className="space-y-4 text-[#e0e7ef]">
                {overallSummary.pros && Array.isArray(overallSummary.pros) && overallSummary.pros.length > 0 && (
                  <div>
                    <span className="font-semibold" style={{ color: "#2cb67d" }}>Pros:</span>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      {overallSummary.pros.map((pro, idx) => (
                        <li key={`pro-${idx}`} className="text-[#e0e7ef]">{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {overallSummary.cons && Array.isArray(overallSummary.cons) && overallSummary.cons.length > 0 && (
                  <div>
                    <span className="font-semibold text-red-400">Cons:</span>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      {overallSummary.cons.map((con, idx) => (
                        <li key={`con-${idx}`} className="text-[#e0e7ef]">{con}</li>
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
            <TranslationSection 
              textToTranslate={prepareSummaryForTranslation(overallSummary)}
              title="Summary Translation"
              className="mt-6"
              onError={(errorMsg) => setError(errorMsg)}
              onTranslationComplete={(translatedText, language) => {
                if (onTranslationUpdate) {
                  onTranslationUpdate(translatedText, language);
                }
              }}
            />
          </div>
          </ErrorBoundary>
        )}
      </div>
      
      {/* Search Statistics */}
      {searchHistory.length > 0 && !loading && (
        <div className="bg-[#23272f] shadow-lg rounded-xl px-6 py-4 border border-[#7f5af0]/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-[#7f5af0]">📊 Search Statistics</h4>
            <span className="text-sm text-[#a786df]">{searchHistory.length} searches</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-[#18181b] rounded-lg p-3">
              <div className="text-[#2cb67d] font-semibold">Success Rate</div>
              <div className="text-xl text-white">
                {Math.round((searchHistory.filter(h => h.success).length / searchHistory.length) * 100)}%
              </div>
            </div>
            <div className="bg-[#18181b] rounded-lg p-3">
              <div className="text-[#7f5af0] font-semibold">Total Cases Analyzed</div>
              <div className="text-xl text-white">
                {searchHistory.reduce((sum, h) => sum + (h.resultCount || 0), 0)}
              </div>
            </div>
            <div className="bg-[#18181b] rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">Most Recent</div>
              <div className="text-sm text-white truncate">
                {searchHistory[0]?.category || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
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
