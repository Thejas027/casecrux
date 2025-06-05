import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfSummarizer from "./components/PdfSummarizer";
import SummaryDetail from "./components/SummaryDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PdfSummarizer />} />
        <Route path="/summary/:id" element={<SummaryDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
