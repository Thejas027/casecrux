import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";
import OverallSummarySidebar from "./components/OverallSummarySidebar";
import OverallSummaryDetail from "./components/OverallSummaryDetail";
import CategoryDownloadSummary from "./components/CategoryDownloadSummary";
import Home from "./components/Home";
import React from "react";
import CategoryBatchPdfSummarizer from "./components/CategoryBatchPdfSummarizer";

function App() {
  return (
    <BrowserRouter>
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
          path="/category-batch-pdf-summarizer"
          element={<CategoryBatchPdfSummarizer />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
