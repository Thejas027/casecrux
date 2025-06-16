import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import MainLayout from "./components/layout/MainLayout";

// New Page Components
import PdfSummarizerPage from "./pages/PdfSummarizerPage";
import MultiPdfSummarizerPage from "./pages/MultiPdfSummarizerPage";
import SummaryDetailPage from "./pages/SummaryDetailPage";
import OverallSummaryPage from "./pages/OverallSummaryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Default route, e.g., single PDF summarizer */}
          <Route index element={<Navigate to="/summarize-pdf" replace />} />
          <Route path="/summarize-pdf" element={<PdfSummarizerPage />} />
          <Route
            path="/summarize-multiple-pdfs"
            element={<MultiPdfSummarizerPage />}
          />

          {/* Route for displaying a single summary detail */}
          <Route path="/summary/:id" element={<SummaryDetailPage />} />

          {/* Route for displaying an overall summary detail */}
          <Route path="/overall-summary/:id" element={<OverallSummaryPage />} />

          {/* Fallback for any other route - can redirect to a 404 page or home */}
          {/* For now, redirecting to the main summarizer page */}
          <Route path="*" element={<Navigate to="/summarize-pdf" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
