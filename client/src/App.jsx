import PdfSummarizer from "./components/PdfSummarizer"; // Added
import MultiPdfSummarizer from "./components/MultiPdfSummarizer";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="flex flex-col md:flex-row gap-8 justify-center items-start w-full max-w-6xl mx-auto">
        <div className="w-full md:w-1/2">
          <PdfSummarizer />
        </div>
        <div className="w-full md:w-1/2">
          <MultiPdfSummarizer />
        </div>
      </div>
    </div>
  );
}

export default App;
