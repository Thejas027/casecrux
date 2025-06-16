import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";
import OverallSummarySidebar from "./components/OverallSummarySidebar";
import OverallSummaryDetail from "./components/OverallSummaryDetail";
import CategoryOverallSummary from "./components/CategoryOverallSummary";
import Home from "./components/Home";
import React from "react";

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
          path="/category-overall-summary"
          element={<CategoryOverallSummary />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
