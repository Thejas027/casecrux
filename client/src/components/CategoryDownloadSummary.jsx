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
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">
        Upload PDF to Cloudinary (with Category)
      </h1>
      <form onSubmit={handleFileUpload} className="mb-6">
        <label className="block mb-2 font-semibold">
          Upload PDF to Cloudinary:
        </label>
        <input
          type="text"
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value)}
          placeholder="Enter category (optional)"
          className="border p-2 rounded w-2/3 mr-2 mb-2"
        />
        <input
          id="cloudinary-upload-input"
          type="file"
          accept="application/pdf"
          className="border p-2 rounded w-2/3 mr-2"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
        {uploadSuccess && (
          <div className="text-green-600 mt-2">{uploadSuccess}</div>
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
      <form onSubmit={handleListCategoryFiles} className="mb-6">
        <label className="block mb-2 font-semibold">
          List PDFs in Category:
        </label>
        <input
          type="text"
          value={listCategory}
          onChange={(e) => setListCategory(e.target.value)}
          placeholder="Enter category to list"
          className="border p-2 rounded w-2/3 mr-2 mb-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={listing || !listCategory.trim()}
        >
          {listing ? "Listing..." : "List PDFs"}
        </button>
      </form>
      {categoryFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">
            PDFs in Category: {listCategory}
          </h2>
          <ul className="list-disc pl-6">
            {categoryFiles.map((file, idx) => (
              <li key={idx} className="mb-2">
                <a
                  href={file.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {file.filename}
                </a>
                <span className="ml-2 text-gray-500 text-xs">
                  ({file.format}, {Math.round(file.bytes / 1024)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CategoryDownloadSummary;
