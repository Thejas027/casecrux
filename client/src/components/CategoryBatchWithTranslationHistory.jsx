import React, { useState } from "react";
import CategoryBatchPdfSummarizer from "./CategoryBatchPdfSummarizer";
import BatchSummaryHistorySidebar from "./BatchSummaryHistorySidebar";

function CategoryBatchWithTranslationHistory() {
  // State to track the current summary and translation
  const [currentSummary, setCurrentSummary] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");

  // This function will be passed to CategoryBatchPdfSummarizer to update our state
  const handleSummaryUpdate = (summary) => {
    setCurrentSummary(summary);
  };

  // This function will be passed to CategoryBatchPdfSummarizer to update translation
  const handleTranslationUpdate = (translation, language) => {
    setCurrentTranslation(translation);
    setCurrentLanguage(language);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BatchSummaryHistorySidebar />
      
      {/* Main content */}
      <div className="flex-1">
        <CategoryBatchPdfSummarizer 
          onSummaryUpdate={handleSummaryUpdate}
          onTranslationUpdate={handleTranslationUpdate}
        />
      </div>
    </div>
  );
}

export default CategoryBatchWithTranslationHistory;
