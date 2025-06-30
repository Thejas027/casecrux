import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const handleListAllPdfs = () => {
    navigate("/category-download-summary?allpdfs=1");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b]">
      <div className="bg-[#23272f] shadow-2xl rounded-2xl p-10 max-w-2xl w-full border-2 border-[#7f5af0]">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-white drop-shadow-lg tracking-wider">
          Welcome to{" "}
          <span className="text-[#7f5af0]" style={{ fontWeight: "bold" }}>
            CaseCrux
          </span>
        </h1>
        <p className="text-center text-lg text-[#e0e7ef] mb-10">
          Your one-stop solution for legal PDF summarization and case analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/pdf-summarizer"
            className="block bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] font-bold py-6 px-6 rounded-xl text-center text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Single PDF Summarizer
            <div className="text-sm font-normal mt-2 text-[#18181b]/80">
              Upload and summarize a single legal PDF
            </div>
          </Link>
          <Link
            to="/category-batch-pdf-summarizer"
            className="block bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-[#18181b] font-bold py-6 px-6 rounded-xl text-center text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Batch PDF Summarizer by Category
            <div className="text-sm font-normal mt-2 text-[#18181b]/80">
              Select and summarize multiple PDFs in a category
            </div>
          </Link>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleListAllPdfs}
            className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            List ALL PDFs in Cloudinary
          </button>
        </div>
        <div className="mt-12 text-center text-[#a786df] text-xs">
          &copy; {new Date().getFullYear()} CaseCrux. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Home;
