import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  
  const handleUploadPdf = () => {
    navigate("/category-download-summary");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#18181b] to-[#1e1b4b]">
      {/* Upload button in top right corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleUploadPdf}
          className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-[#18181b] px-6 py-3 rounded-xl font-semibold"
        >
          Upload PDF
        </button>
      </div>

      {/* Main content - full width */}
      <div className="min-h-screen px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-8">
            <div className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] p-4 rounded-2xl">
              <svg className="w-12 h-12 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-black text-center mb-6 bg-gradient-to-r from-white via-[#e0e7ef] to-[#7f5af0] bg-clip-text text-transparent">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] bg-clip-text text-transparent">
              CaseCrux
            </span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] mx-auto rounded-full mb-8"></div>
          <p className="text-center text-xl text-[#e0e7ef]/80 mb-4 max-w-3xl mx-auto">
            Your intelligent companion for legal PDF analysis and case summarization
          </p>
          <p className="text-center text-sm text-[#a786df]/60 max-w-2xl mx-auto">
            Powered by advanced AI to transform complex legal documents into clear, actionable insights
          </p>
        </div>
        
        {/* Features Grid - full width */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16 max-w-7xl mx-auto">
          <Link
            to="/pdf-summarizer"
            className="bg-gradient-to-br from-[#7f5af0]/10 to-[#2cb67d]/10 border border-[#7f5af0]/30 rounded-2xl p-8 hover:border-[#7f5af0]/50 transition-all duration-300"
          >
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Single PDF Summarizer
              </h3>
              <p className="text-[#e0e7ef]/70 text-sm leading-relaxed">
                Upload and get instant AI-powered summaries of individual legal documents with key insights and analysis
              </p>
            </div>
            <div className="flex items-center text-[#7f5af0] text-sm font-medium">
              Get Started
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>

          <Link
            to="/advanced-pdf-summarizer"
            className="bg-gradient-to-br from-[#ff6b6b]/10 to-[#4ecdc4]/10 border border-[#ff6b6b]/30 rounded-2xl p-8 hover:border-[#ff6b6b]/50 transition-all duration-300 relative"
          >
            {/* NEW badge */}
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] text-[#18181b] px-2 py-1 rounded-lg text-xs font-bold">
              NEW
            </div>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                🚀 Advanced PDF Summarizer
              </h3>
              <p className="text-[#e0e7ef]/70 text-sm leading-relaxed mb-2">
                <strong className="text-[#ff6b6b]">Multiple levels of summarization:</strong> Detailed, Concise, Executive analysis
              </p>
              <p className="text-[#e0e7ef]/70 text-sm leading-relaxed">
                <strong className="text-[#4ecdc4]">Abstractive & Extractive:</strong> AI-generated insights plus key sentence extraction
              </p>
            </div>
            <div className="flex items-center text-[#ff6b6b] text-sm font-medium">
              Try Advanced Features
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>
          
          <Link
            to="/category-batch-pdf-summarizer"
            className="bg-gradient-to-br from-[#2cb67d]/10 to-[#7f5af0]/10 border border-[#2cb67d]/30 rounded-2xl p-8 hover:border-[#2cb67d]/50 transition-all duration-300"
          >
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                🔍 Search and Summary
              </h3>
              <p className="text-[#e0e7ef]/70 text-sm leading-relaxed">
                Search and process multiple legal documents by category with comprehensive analysis, pros/cons evaluation, and final judgments
              </p>
            </div>
            <div className="flex items-center text-[#2cb67d] text-sm font-medium">
              Search & Analyze
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>

          <Link
            to="/chat"
            className="bg-gradient-to-br from-[#ff6b6b]/10 to-[#4ecdc4]/10 border border-[#ff6b6b]/30 rounded-2xl p-8 hover:border-[#ff6b6b]/50 transition-all duration-300 relative"
          >
            {/* NEW badge */}
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] text-white text-xs font-bold px-3 py-1 rounded-full">
              NEW
            </div>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#18181b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                🤖 AI Legal Assistant
              </h3>
              <p className="text-[#e0e7ef]/70 text-sm leading-relaxed">
                Interactive AI chatbot to answer questions about your documents, explain legal concepts, and provide personalized guidance
              </p>
            </div>
            <div className="flex items-center text-[#ff6b6b] text-sm font-medium">
              Chat Now
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>
        </div>
        
        {/* Features highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-[#7f5af0]/5 border border-[#7f5af0]/20">
            <div className="w-12 h-12 bg-[#7f5af0]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#7f5af0]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#7f5af0] mb-2">AI-Powered</h4>
            <p className="text-sm text-[#e0e7ef]/60">Advanced algorithms</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[#ff6b6b]/5 border border-[#ff6b6b]/20">
            <div className="w-12 h-12 bg-[#ff6b6b]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#ff6b6b] mb-2">Multi-Level</h4>
            <p className="text-sm text-[#e0e7ef]/60">Advanced analysis types</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[#4ecdc4]/5 border border-[#4ecdc4]/20">
            <div className="w-12 h-12 bg-[#4ecdc4]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#4ecdc4]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V11a1 1 0 11-2 0v-.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v.277l1.254-.145a1 1 0 01.992 1.736L5.016 14l.23.132a1 1 0 11-.372 1.364l-1.733-.99A.996.996 0 013 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a.996.996 0 01-.52.878l-1.734.99a1 1 0 11-1.364-.372L14.984 14l-.23-.132a1 1 0 11.992-1.736L16.984 12V11a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364.372L10 17.152l1.254-.716a1 1 0 11.992 1.736l-1.75 1a1 1 0 01-.992 0l-1.75-1a1 1 0 01.372-1.364z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#4ecdc4] mb-2">Dual Methods</h4>
            <p className="text-sm text-[#e0e7ef]/60">Abstractive + Extractive</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[#2cb67d]/5 border border-[#2cb67d]/20">
            <div className="w-12 h-12 bg-[#2cb67d]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#2cb67d]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#2cb67d] mb-2">Search & Batch</h4>
            <p className="text-sm text-[#e0e7ef]/60">Categorized analysis</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[#7f5af0]/5 border border-[#7f5af0]/20">
            <div className="w-12 h-12 bg-[#7f5af0]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#7f5af0]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#7f5af0] mb-2">Fast</h4>
            <p className="text-sm text-[#e0e7ef]/60">Instant results</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-[#7f5af0]/30 to-transparent mb-6"></div>
          <p className="text-[#a786df]/60 text-sm">
            &copy; {new Date().getFullYear()} CaseCrux. Transforming legal analysis with AI.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
