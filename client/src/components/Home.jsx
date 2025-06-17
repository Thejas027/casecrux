import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const handleListAllPdfs = () => {
    navigate("/category-download-summary?allpdfs=1");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-50">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-2xl w-full border-2 border-indigo-200">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-700 drop-shadow-lg">
          Welcome to{" "}
          <span className="text-purple-600" style={{ fontWeight: "bold" }}>
            CaseCrux
          </span>
        </h1>
        <p className="text-center text-lg text-gray-600 mb-10">
          Your one-stop solution for legal PDF summarization and case analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/pdf-summarizer"
            className="block bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-6 px-6 rounded-xl text-center text-xl shadow-lg transition-all duration-200"
          >
            Single PDF Summarizer
            <div className="text-sm font-normal mt-2 text-indigo-100">
              Upload and summarize a single legal PDF
            </div>
          </Link>
          <Link
            to="/category-overall-summary"
            className="block bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-6 px-6 rounded-xl text-center text-xl shadow-lg transition-all duration-200"
          >
            Category Overall Summary
            <div className="text-sm font-normal mt-2 text-green-100">
              Get an overall summary for all PDFs in a category
            </div>
          </Link>
          <Link
            to="/category-batch-pdf-summarizer"
            className="block bg-gradient-to-r from-pink-500 to-indigo-400 hover:from-pink-600 hover:to-indigo-500 text-white font-bold py-6 px-6 rounded-xl text-center text-xl shadow-lg transition-all duration-200"
          >
            Batch PDF Summarizer by Category
            <div className="text-sm font-normal mt-2 text-pink-100">
              Select and summarize multiple PDFs in a category
            </div>
          </Link>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleListAllPdfs}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all duration-150"
          >
            List ALL PDFs in Cloudinary
          </button>
        </div>
        <div className="mt-12 text-center text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} CaseCrux. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Home;
