import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";
import OverallSummarySidebar from "./components/OverallSummarySidebar";
import OverallSummaryDetail from "./components/OverallSummaryDetail";
import CategoryDownloadSummary from "./components/CategoryDownloadSummary";
import Home from "./components/Home";
import React from "react";
import CategoryBatchPdfSummarizer from "./components/CategoryBatchPdfSummarizer";
import CategoryBatchWithTranslationHistory from "./components/CategoryBatchWithTranslationHistory";
import BatchSummaryHistorySidebar from "./components/BatchSummaryHistorySidebar";
import BatchSummaryDetail from "./components/BatchSummaryDetail";
import AdvancedPdfSummarizer from "./components/AdvancedPdfSummarizer";

function App() {
  return (
    <BrowserRouter>
      <div className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/pdf-summarizer"
            element={
              <div className="flex min-h-screen">
                <OverallSummarySidebar />
                <div className="flex-1">
                  <PdfSummarizer />
                </div>
              </div>
            }
          />
          <Route
            path="/summary/:id"
            element={
              <div className="flex min-h-screen">
                <OverallSummarySidebar />
                <div className="flex-1">
                  <SummaryDetail />
                </div>
              </div>
            }
          />
          <Route
            path="/overall-summary/:id"
            element={
              <div className="flex min-h-screen">
                <OverallSummarySidebar />
                <div className="flex-1">
                  <OverallSummaryDetail />
                </div>
              </div>
            }
          />
          <Route
            path="/category-download-summary"
            element={<CategoryDownloadSummary />}
          />
          <Route
            path="/advanced-pdf-summarizer"
            element={<AdvancedPdfSummarizer />}
          />
          <Route
            path="/category-batch-pdf-summarizer"
            element={<CategoryBatchWithTranslationHistory />}
          />
          <Route
            path="/batch-summary/:id"
            element={
              <div className="flex min-h-screen">
                <BatchSummaryHistorySidebar />
                <div className="flex-1">
                  <BatchSummaryDetail />
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
