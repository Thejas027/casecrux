import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InlineSpinner } from "./Spinner";
import TranslationSection from "./TranslationSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function OverallSummaryDetail() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    setSummary(null);
    axios
      .get(`${BACKEND_URL}/api/overall-summary/${id}`)
      .then((res) => setSummary(res.data))
      .catch(() => setError("Failed to fetch summary."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob(
      [
        typeof summary.finalSummary === "string"
          ? summary.finalSummary
          : (summary.finalSummary?.output_text || 'No summary available'),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overall-summary-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Breadcrumbs
  const breadcrumbs = (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex text-[#7f5af0]">
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <span className="mx-2">&gt;</span>
        </li>
        <li className="text-[#2cb67d] font-semibold">OverallSummary-{id}</li>
      </ol>
    </nav>
  );

  if (!id) return null;
  if (loading) return <InlineSpinner text="Loading summary..." />;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!summary) return null;

  return (
    <div className="p-8 flex-1 min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef]">
      <div className="max-w-2xl mx-auto bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
        {breadcrumbs}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold" style={{ color: "#7f5af0" }}>
            {summary.caseId || summary._id}
          </h1>
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Download Overall Summary"
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
        </div>
        <div className="bg-[#18181b] p-4 rounded border border-[#7f5af0] text-[#e0e7ef] text-lg overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold text-[#2cb67d] mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold text-[#7f5af0] mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium text-[#a786df] mb-2">{children}</h3>,
              p: ({ children }) => <p className="text-[#e0e7ef] mb-3 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-3 text-[#e0e7ef]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 text-[#e0e7ef]">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="text-[#2cb67d] font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-[#7f5af0]">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[#7f5af0] pl-4 italic text-[#a786df] my-4">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }) => 
                inline ? (
                  <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#7f5af0] font-mono text-sm">
                    {children}
                  </code>
                ) : (
                  <pre className="bg-[#2d2d2d] p-4 rounded-lg overflow-x-auto">
                    <code className="text-[#2cb67d] font-mono text-sm">{children}</code>
                  </pre>
                ),
            }}
          >
            {summary.finalSummary || (summary.finalSummary?.output_text || 'No summary available')}
          </ReactMarkdown>
        </div>
        {summary.pros && summary.pros.length > 0 && (
          <section className="mt-4">
            <h3 className="font-bold text-green-400 text-lg mb-1">Pros</h3>
            <ul className="list-disc pl-6">
              {summary.pros.map((pro, i) => (
                <li key={i} className="text-green-300">
                  {pro}
                </li>
              ))}
            </ul>
          </section>
        )}
        {summary.cons && summary.cons.length > 0 && (
          <section className="mt-4">
            <h3 className="font-bold text-red-400 text-lg mb-1">Cons</h3>
            <ul className="list-disc pl-6">
              {summary.cons.map((con, i) => (
                <li key={i} className="text-red-300">
                  {con}
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Translation Section */}
        <TranslationSection 
          textToTranslate={summary.finalSummary || (summary.finalSummary?.output_text || 'No summary available')}
          title="Overall Summary Translation"
          className="mt-6"
          onError={(errorMsg) => setError(errorMsg)}
        />
      </div>
    </div>
  );
}

export default OverallSummaryDetail;
