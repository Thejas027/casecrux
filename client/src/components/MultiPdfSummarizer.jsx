import React, { useState } from "react";
import axios from "axios";
import { ButtonSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function MultiPdfSummarizer() {
  const [files, setFiles] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilesChange = (event) => {
    setFiles(Array.from(event.target.files));
    setResults(null);
    setError("");
  };

  const handleCaseIdChange = (event) => {
    setCaseId(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!caseId) {
      setError("Please enter a Case ID.");
      return;
    }
    if (!files.length) {
      setError("Please select at least one PDF file.");
      return;
    }
    setIsLoading(true);
    setError("");
    setResults(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("caseid", caseId);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/multi-summarize`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResults(response.data);
    } catch (err) {
      let errorMessage = "Failed to summarize PDFs. Please try again.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
        if (err.response.data.details) {
          errorMessage += ` Details: ${JSON.stringify(
            err.response.data.details
          )}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] p-4 rounded-2xl shadow-2xl">
              <svg className="w-12 h-12 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-[#e0e7ef] to-[#7f5af0] bg-clip-text text-transparent">
            Multi-PDF Case Summarizer
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] mx-auto rounded-full mb-4"></div>
          <p className="text-[#a786df] text-lg max-w-2xl mx-auto">
            Analyze multiple legal documents simultaneously and generate comprehensive case summaries with AI-powered insights
          </p>
        </div>

        {/* Enhanced Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#23272f] shadow-2xl rounded-2xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0] relative overflow-hidden"
        >
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7f5af0]/5 to-[#2cb67d]/5 pointer-events-none"></div>
          <div className="relative z-10">
          <div className="mb-6">
            <label
              className="block text-[#e0e7ef] text-lg font-bold mb-3 flex items-center gap-2"
              htmlFor="case-id"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.5 3A1.5 1.5 0 0 1 4 1.5h8A1.5 1.5 0 0 1 13.5 3v2A1.5 1.5 0 0 1 12 6.5h-1.5a.5.5 0 0 1 0-1H12a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H4a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 1 0 1H4A1.5 1.5 0 0 1 2.5 5V3z"/>
                <path d="M6.5 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/>
                <path d="M3 8.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Case ID
            </label>
            <input
              id="case-id"
              type="text"
              value={caseId}
              onChange={handleCaseIdChange}
              placeholder="e.g. robbery-case-1"
              className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg w-full py-3 px-4 text-[#e0e7ef] placeholder-[#a786df] leading-tight focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] text-lg transition-all duration-150"
            />
          </div>
          <div className="mb-8">
            <label
              className="block text-[#e0e7ef] text-lg font-bold mb-3 flex items-center gap-2"
              htmlFor="pdfs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.135.667z"/>
              </svg>
              Select PDF Files
            </label>
            <div className="relative">
              <input
                id="pdfs"
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFilesChange}
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg w-full py-4 px-4 text-[#e0e7ef] file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#7f5af0] file:to-[#2cb67d] file:text-[#18181b] hover:file:from-[#2cb67d] hover:file:to-[#7f5af0] leading-tight focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] text-lg transition-all duration-300 hover:border-[#2cb67d]"
              />
              {files.length > 0 && (
                <div className="mt-3 text-sm text-[#2cb67d]">
                  ✓ {files.length} file{files.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={isLoading || !caseId || !files.length}
              className={`bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-white font-bold py-4 px-12 rounded-xl focus:outline-none focus:shadow-outline text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                isLoading || !caseId || !files.length
                  ? "opacity-50 cursor-not-allowed transform-none"
                  : "hover:shadow-[#7f5af0]/25"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <ButtonSpinner />
                  <span>Analyzing Documents...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                  </svg>
                  <span>Summarize All Documents</span>
                </div>
              )}
            </button>
          </div>
          </div>
        </form>
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg relative mb-6 text-lg">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {results && (
          <div className="mt-8 bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
            {/* Header with Download Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold text-[#7f5af0]">
                Case Summary Results
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const finalSummaryText = results.finalSummary || "No final summary available";
                    const blob = new Blob([finalSummaryText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${caseId}-final-summary.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="Download Final Summary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  Final Summary
                </button>
                <button
                  onClick={() => {
                    let allSummariesText = `Case ID: ${caseId}\n\n`;
                    allSummariesText += "=".repeat(50) + "\n";
                    allSummariesText += "INDIVIDUAL SUMMARIES\n";
                    allSummariesText += "=".repeat(50) + "\n\n";
                    
                    if (results.summaries) {
                      results.summaries.forEach((s, idx) => {
                        allSummariesText += `${idx + 1}. ${s.pdfName}\n`;
                        allSummariesText += "-".repeat(30) + "\n";
                        allSummariesText += (typeof s.summary === "string" ? s.summary : s.summary.output_text || JSON.stringify(s.summary)) + "\n\n";
                      });
                    }
                    
                    allSummariesText += "\n" + "=".repeat(50) + "\n";
                    allSummariesText += "FINAL SUMMARY\n";
                    allSummariesText += "=".repeat(50) + "\n\n";
                    allSummariesText += results.finalSummary || "No final summary available";
                    
                    if (results.pros && results.pros.length > 0) {
                      allSummariesText += "\n\n" + "=".repeat(50) + "\n";
                      allSummariesText += "PROS\n";
                      allSummariesText += "=".repeat(50) + "\n";
                      results.pros.forEach((pro, i) => {
                        allSummariesText += `${i + 1}. ${pro}\n`;
                      });
                    }
                    
                    if (results.cons && results.cons.length > 0) {
                      allSummariesText += "\n\n" + "=".repeat(50) + "\n";
                      allSummariesText += "CONS\n";
                      allSummariesText += "=".repeat(50) + "\n";
                      results.cons.forEach((con, i) => {
                        allSummariesText += `${i + 1}. ${con}\n`;
                      });
                    }
                    
                    const blob = new Blob([allSummariesText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${caseId}-complete-analysis.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="Download Complete Analysis"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.135.667z"/>
                  </svg>
                  Complete Analysis
                </button>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-[#2cb67d] mb-4">
                Individual Summaries:
              </h3>
              <div className="space-y-4">
                {results.summaries &&
                  results.summaries.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-[#18181b] rounded-lg p-6 shadow border border-[#7f5af0] hover:border-[#2cb67d] transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                        <h4 className="font-bold text-[#7f5af0] text-lg">
                          {s.pdfName}
                        </h4>
                        <button
                          onClick={() => {
                            const summaryText = typeof s.summary === "string" ? s.summary : s.summary.output_text || JSON.stringify(s.summary);
                            const blob = new Blob([summaryText], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${caseId}-${s.pdfName}-summary.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="bg-[#23272f] border border-[#7f5af0] text-[#7f5af0] hover:bg-[#7f5af0] hover:text-[#18181b] px-3 py-1 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          title={`Download ${s.pdfName} Summary`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                          </svg>
                          Download
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-[#e0e7ef] leading-relaxed">
                        {typeof s.summary === "string"
                          ? s.summary
                          : s.summary.output_text || JSON.stringify(s.summary)}
                      </pre>
                      
                      {/* Translation Section for Individual Summary */}
                      <TranslationSection 
                        textToTranslate={typeof s.summary === "string" ? s.summary : s.summary.output_text || JSON.stringify(s.summary)}
                        title={`${s.pdfName} Translation`}
                        className="mt-4"
                        onError={(errorMsg) => setError(errorMsg)}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="text-2xl font-semibold text-[#2cb67d]">
                  Final Summary
                </h3>
                <button
                  onClick={() => {
                    const blob = new Blob([results.finalSummary], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${caseId}-final-summary.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-[#23272f] border border-[#2cb67d] text-[#2cb67d] hover:bg-[#2cb67d] hover:text-[#18181b] px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  title="Download Final Summary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  Download Final Summary
                </button>
              </div>
              <pre className="whitespace-pre-wrap bg-[#18181b] rounded-lg p-6 shadow text-[#e0e7ef] border border-[#7f5af0] leading-relaxed">
                {results.finalSummary}
              </pre>
              
              {/* Translation Section for Final Summary */}
              <TranslationSection 
                textToTranslate={results.finalSummary}
                title="Final Summary Translation"
                className="mt-6"
                onError={(errorMsg) => setError(errorMsg)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#18181b] rounded-lg p-6 border border-[#2cb67d]/50 hover:border-[#2cb67d] transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-[#2cb67d] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                    </svg>
                    Pros
                  </h4>
                  {results.pros && results.pros.length > 0 && (
                    <button
                      onClick={() => {
                        const prosText = `Case ID: ${caseId}\n\nPROS:\n${results.pros.map((pro, i) => `${i + 1}. ${pro}`).join('\n')}`;
                        const blob = new Blob([prosText], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${caseId}-pros.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-[#2cb67d] hover:text-[#18181b] hover:bg-[#2cb67d] p-2 rounded-lg transition-all duration-200"
                      title="Download Pros"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                      </svg>
                    </button>
                  )}
                </div>
                <ul className="list-none space-y-3">
                  {results.pros && results.pros.length > 0 ? (
                    results.pros.map((pro, i) => (
                      <li key={i} className="text-[#e0e7ef] flex items-start gap-3">
                        <span className="text-[#2cb67d] font-bold text-lg leading-none mt-1">•</span>
                        <span className="leading-relaxed">{pro}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#a786df] italic">No pros found.</li>
                  )}
                </ul>
              </div>
              <div className="bg-[#18181b] rounded-lg p-6 border border-red-500/50 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-red-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                    Cons
                  </h4>
                  {results.cons && results.cons.length > 0 && (
                    <button
                      onClick={() => {
                        const consText = `Case ID: ${caseId}\n\nCONS:\n${results.cons.map((con, i) => `${i + 1}. ${con}`).join('\n')}`;
                        const blob = new Blob([consText], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${caseId}-cons.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-red-400 hover:text-[#18181b] hover:bg-red-400 p-2 rounded-lg transition-all duration-200"
                      title="Download Cons"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                      </svg>
                    </button>
                  )}
                </div>
                <ul className="list-none space-y-3">
                  {results.cons && results.cons.length > 0 ? (
                    results.cons.map((con, i) => (
                      <li key={i} className="text-[#e0e7ef] flex items-start gap-3">
                        <span className="text-red-400 font-bold text-lg leading-none mt-1">•</span>
                        <span className="leading-relaxed">{con}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#a786df] italic">No cons found.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiPdfSummarizer;
