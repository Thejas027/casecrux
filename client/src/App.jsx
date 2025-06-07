import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";
import OverallSummarySidebar from "./components/OverallSummarySidebar";
import OverallSummaryDetail from "./components/OverallSummaryDetail";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <OverallSummarySidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<PdfSummarizer />} />
            <Route path="/summary/:id" element={<SummaryDetail />} />
            <Route
              path="/overall-summary/:id"
              element={<OverallSummaryDetail />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
