import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FullPageSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;



function BatchSummaryDetail() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BACKEND_URL}/api/batch-summary-history/${id}`);
        setSummary(res.data);
      } catch (err) {
        setError("Failed to fetch batch summary.");
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchSummary();
    }
  }, [id]);

  // Helper function to prepare complete summary text for translation
  const prepareSummaryForTranslation = (summaryData) => {
    if (!summaryData || !summaryData.summary) return "";
    
    console.log("=== DEBUG BatchSummaryDetail: Summary structure ===");
    console.log("Summary data:", summaryData);
    console.log("Summary content keys:", Object.keys(summaryData.summary));
    
    const { summary: summaryContent } = summaryData;
    let textParts = [];
    
    // Add category and creation info as header
    if (summaryData.category) {
      textParts.push(`Category: ${summaryData.category}`);
    }
    
    if (summaryData.createdAt) {
      const date = new Date(summaryData.createdAt).toLocaleDateString();
      textParts.push(`Date: ${date}\n`);
    }
    
    // PRIORITY 1: If summary.raw exists, use it as it contains the complete formatted summary
    if (summaryContent.raw && summaryContent.raw.trim().length > 0) {
      console.log("✅ Using summary.raw - contains complete formatted summary");
      textParts.push(summaryContent.raw);
      
      // Join and return immediately since raw contains everything
      const fullText = textParts.join('\n').trim();
      console.log(`📋 Prepared ${fullText.length} characters for translation (from raw)`);
      console.log(`📄 First 500 chars:`, fullText.substring(0, 500));
      return fullText;
    }
    
    // PRIORITY 2: If summary is a string (markdown format), use it
    if (typeof summaryContent === 'string') {
      console.log("✅ Using string summary");
      textParts.push(summaryContent);
      const fullText = textParts.join('\n').trim();
      console.log(`📋 Prepared ${fullText.length} characters for translation (from string)`);
      return fullText;
    }
    
    // PRIORITY 3: If summary is an object, extract all available content
    if (summaryContent && typeof summaryContent === 'object') {
      console.log("✅ Using object summary - extracting all fields");
      
      // Primary summary content
      if (summaryContent.summary) {
        textParts.push(`=== MAIN SUMMARY ===`);
        textParts.push(summaryContent.summary);
      }
      
      // Executive summary
      if (summaryContent.executive_summary) {
        textParts.push(`\n=== EXECUTIVE SUMMARY ===`);
        textParts.push(summaryContent.executive_summary);
      }
      
      // Key points or legal points
      if (summaryContent.key_points) {
        textParts.push(`\n=== KEY POINTS ===`);
        textParts.push(summaryContent.key_points);
      }
      
      // Legal analysis
      if (summaryContent.legal_analysis) {
        textParts.push(`\n=== LEGAL ANALYSIS ===`);
        textParts.push(summaryContent.legal_analysis);
      }
      
      // Factual background
      if (summaryContent.factual_background) {
        textParts.push(`\n=== FACTUAL BACKGROUND ===`);
        textParts.push(summaryContent.factual_background);
      }
      
      // Legal reasoning
      if (summaryContent.legal_reasoning) {
        textParts.push(`\n=== LEGAL REASONING ===`);
        textParts.push(summaryContent.legal_reasoning);
      }
      
      // Final assessment
      if (summaryContent.final_assessment) {
        textParts.push(`\n=== FINAL ASSESSMENT ===`);
        textParts.push(summaryContent.final_assessment);
      }
      
      // Additional insights
      if (summaryContent.additional_insights) {
        textParts.push(`\n=== ADDITIONAL INSIGHTS ===`);
        textParts.push(summaryContent.additional_insights);
      }
      
      // Pros section
      if (summaryContent.pros && summaryContent.pros.length > 0) {
        textParts.push(`\n=== PROS ===`);
        summaryContent.pros.forEach((pro, index) => {
          textParts.push(`${index + 1}. ${pro}`);
        });
      }
      
      // Cons section
      if (summaryContent.cons && summaryContent.cons.length > 0) {
        textParts.push(`\n=== CONS ===`);
        summaryContent.cons.forEach((con, index) => {
          textParts.push(`${index + 1}. ${con}`);
        });
      }
      
      // Final judgment section
      if (summaryContent.final_judgment) {
        textParts.push(`\n=== FINAL JUDGMENT ===`);
        textParts.push(summaryContent.final_judgment);
      }
      
      // Overall analysis if available
      if (summaryContent.overall_analysis) {
        textParts.push(`\n=== OVERALL ANALYSIS ===`);
        textParts.push(summaryContent.overall_analysis);
      }
      
      // Key findings if available
      if (summaryContent.key_findings && summaryContent.key_findings.length > 0) {
        textParts.push(`\n=== KEY FINDINGS ===`);
        summaryContent.key_findings.forEach((finding, index) => {
          textParts.push(`${index + 1}. ${finding}`);
        });
      }
      
      // Recommendations if available
      if (summaryContent.recommendations && summaryContent.recommendations.length > 0) {
        textParts.push(`\n=== RECOMMENDATIONS ===`);
        summaryContent.recommendations.forEach((rec, index) => {
          textParts.push(`${index + 1}. ${rec}`);
        });
      }
    }
    
    // Join all parts with proper spacing
    const fullText = textParts.join('\n').trim();
    
    console.log(`📋 Prepared ${fullText.length} characters for translation (from object fields)`);
    console.log(`📝 Sections included: ${textParts.filter(part => part.includes('===')).length} main sections`);
    console.log(`📄 First 500 chars:`, fullText.substring(0, 500));
    
    return fullText;
  };

  // Handle translation completion with saving to history
  const handleTranslationComplete = async (translatedText, language) => {
    try {
      await axios.post(`${BACKEND_URL}/api/batch-summary-history/${id}/translations`, {
        language: language,
        text: translatedText
      });
    } catch (saveErr) {
      console.warn("Failed to save translation to history:", saveErr);
      // Don't show error to user as translation still succeeded
    }
  };



  if (loading) {
    return <FullPageSpinner text="Loading summary..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] p-8 text-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] p-8 text-center">
        <div className="text-lg">Summary not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-2">
      <div className="container mx-auto p-6 max-w-4xl">
        <Link
          to="/category-batch-pdf-summarizer"
          className="inline-block mb-6 text-[#7f5af0] hover:text-[#2cb67d] transition-colors duration-150 font-medium"
        >
          &larr; Back to Batch Summarizer
        </Link>
        
        <div className="bg-[#23272f] rounded-xl shadow-2xl p-8 border-2 border-[#7f5af0]">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#7f5af0]">
              {summary.category} Summary
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  let content = `Category: ${summary.category}\nDate: ${new Date(summary.createdAt).toLocaleString()}\n\n`;
                  
                  if (summary.pdfNames && summary.pdfNames.length > 0) {
                    content += `PDFs Included:\n${summary.pdfNames.join("\n")}\n\n`;
                  }
                  
                  if (summary.summary.pros && summary.summary.pros.length > 0) {
                    content += `Pros:\n${summary.summary.pros.join("\n")}\n\n`;
                  }
                  if (summary.summary.cons && summary.summary.cons.length > 0) {
                    content += `Cons:\n${summary.summary.cons.join("\n")}\n\n`;
                  }
                  if (summary.summary.final_judgment) {
                    content += `Final Judgment:\n${summary.summary.final_judgment}\n\n`;
                  }
                  if (summary.summary.raw) {
                    content += `Additional Details:\n${summary.summary.raw}`;
                  }
                  
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `batch-summary-${summary.category}-${summary._id}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Download Summary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5V13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.6a.5.5 0 0 1 1 0V13a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-2.6a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                </svg>
                Download Summary
              </button>
              <span className="text-sm text-[#a786df]">
                {new Date(summary.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* PDFs section */}
          {summary.pdfNames && summary.pdfNames.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">PDFs Included:</h2>
              <div className="bg-[#18181b] p-4 rounded-lg border border-[#7f5af0]">
                <ul className="list-disc pl-6 space-y-2">
                  {summary.pdfNames.map((name, i) => (
                    <li key={i} className="text-[#e0e7ef]">
                      {summary.pdfUrls && summary.pdfUrls[i] ? (
                        <a 
                          href={summary.pdfUrls[i]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#7f5af0] hover:text-[#2cb67d] transition-colors duration-150 underline"
                        >
                          {name}
                        </a>
                      ) : (
                        name
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Summary section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">Summary:</h2>
            <div className="bg-[#18181b] p-6 rounded-lg border border-[#7f5af0]">
              {summary.summary.pros && summary.summary.pros.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Pros:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    {summary.summary.pros.map((pro, index) => (
                      <li key={index} className="text-[#e0e7ef]">{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary.summary.cons && summary.summary.cons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Cons:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    {summary.summary.cons.map((con, index) => (
                      <li key={index} className="text-[#e0e7ef]">{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary.summary.final_judgment && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Final Judgment:</h3>
                  <p className="text-[#e0e7ef] leading-relaxed">{summary.summary.final_judgment}</p>
                </div>
              )}
              
              {summary.summary.raw && (
                <div>
                  <h3 className="font-bold text-[#7f5af0] text-lg mb-3">Additional Details:</h3>
                  <p className="text-[#e0e7ef] whitespace-pre-line leading-relaxed">{summary.summary.raw}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Translation section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#2cb67d] mb-4">Translations:</h2>
            <TranslationSection 
              textToTranslate={prepareSummaryForTranslation(summary)}
              onTranslationComplete={handleTranslationComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchSummaryDetail;
