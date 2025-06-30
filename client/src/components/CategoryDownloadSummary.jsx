import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryDownloadSummary() {
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [error, setError] = useState("");
  const [listCategory, setListCategory] = useState("");
  const [categoryFiles, setCategoryFiles] = useState([]);
  const [listing, setListing] = useState(false);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadSuccess("");
    setError("");
    const fileInput = document.getElementById("cloudinary-upload-input");
    if (!fileInput.files.length) {
      setError("Please select a PDF file to upload.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("category", uploadCategory.trim());
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/cloudinary-upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadSuccess(`Uploaded: ${response.data.public_id}`);
      fileInput.value = "";
      setUploadCategory("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleListCategoryFiles = async (e) => {
    e.preventDefault();
    setListing(true);
    setError("");
    setCategoryFiles([]);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/cloudinary-list-files-by-category`,
        { category: listCategory.trim() }
      );
      setCategoryFiles(response.data.files || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to list files.");
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#7f5af0]">
          PDF Category Management
        </h1>
        
        {/* Upload Section */}
        <div className="bg-[#23272f] rounded-xl shadow-2xl p-8 mb-8 border-2 border-[#7f5af0]">
          <h2 className="text-2xl font-semibold mb-6 text-[#2cb67d]">Upload PDF to Cloudinary</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold text-[#e0e7ef]">
                Category:
              </label>
              <input
                type="text"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                placeholder="Enter category (optional)"
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg px-4 py-2 w-full text-[#e0e7ef] placeholder-[#a786df] focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] transition-all duration-150"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-[#e0e7ef]">
                Select PDF File:
              </label>
              <input
                id="cloudinary-upload-input"
                type="file"
                accept="application/pdf"
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg px-4 py-2 w-full text-[#e0e7ef] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7f5af0] file:text-[#18181b] hover:file:bg-[#2cb67d] transition-all duration-150"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#2cb67d] hover:to-[#7f5af0] text-[#18181b] px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#18181b] mr-2"></div>
                  Uploading...
                </div>
              ) : (
                "Upload PDF"
              )}
            </button>
            {uploadSuccess && (
              <div className="bg-[#2cb67d]/20 border border-[#2cb67d] text-[#2cb67d] p-4 rounded-lg">
                {uploadSuccess}
              </div>
            )}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* List Section */}
        <div className="bg-[#23272f] rounded-xl shadow-2xl p-8 border-2 border-[#7f5af0]">
          <h2 className="text-2xl font-semibold mb-6 text-[#2cb67d]">List PDFs by Category</h2>
          <form onSubmit={handleListCategoryFiles} className="space-y-4 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-[#e0e7ef]">
                Category Name:
              </label>
              <input
                type="text"
                value={listCategory}
                onChange={(e) => setListCategory(e.target.value)}
                placeholder="Enter category to list"
                className="bg-[#18181b] border-2 border-[#7f5af0] rounded-lg px-4 py-2 w-full text-[#e0e7ef] placeholder-[#a786df] focus:outline-none focus:ring-2 focus:ring-[#2cb67d] focus:border-[#2cb67d] transition-all duration-150"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#2cb67d] to-[#7f5af0] hover:from-[#7f5af0] hover:to-[#2cb67d] text-[#18181b] px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
              disabled={listing || !listCategory.trim()}
            >
              {listing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#18181b] mr-2"></div>
                  Listing...
                </div>
              ) : (
                "List PDFs"
              )}
            </button>
          </form>
          
          {categoryFiles.length > 0 && (
            <div className="bg-[#18181b] p-6 rounded-lg border border-[#7f5af0]">
              <h3 className="font-semibold mb-4 text-[#7f5af0] text-lg">
                PDFs in Category: {listCategory}
              </h3>
              <div className="grid gap-3">
                {categoryFiles.map((file, idx) => (
                  <div key={idx} className="bg-[#23272f] p-4 rounded-lg border border-[#2cb67d]/30 hover:border-[#2cb67d] transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <a
                        href={file.secure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7f5af0] hover:text-[#2cb67d] underline font-medium transition-colors duration-150"
                      >
                        {file.filename}
                      </a>
                      <span className="text-[#a786df] text-sm">
                        ({file.format.toUpperCase()}, {Math.round(file.bytes / 1024)} KB)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryDownloadSummary;
