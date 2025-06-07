import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";
import OverallSummarySidebar from "./components/OverallSummarySidebar";
import OverallSummaryDetail from "./components/OverallSummaryDetail";
import React, { useState } from "react";

function App() {
  const [selectedOverallId, setSelectedOverallId] = useState(null);
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <OverallSummarySidebar
          onSelect={setSelectedOverallId}
          selectedId={selectedOverallId}
        />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<PdfSummarizer />} />
            <Route path="/summary/:id" element={<SummaryDetail />} />
          </Routes>
          <OverallSummaryDetail summaryId={selectedOverallId} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
