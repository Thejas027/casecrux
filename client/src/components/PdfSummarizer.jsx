import React, { useState } from "react";
import axios from "axios";

function PdfSummarizer() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setSummary("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a PDF file to summarize.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSummary("");

    const formData = new FormData();
    formData.append("file", file); // Key 'file' must match multer setup in backend

    try {
      const response = await axios.post(
        "http://localhost:5000/api/summarize",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // The error "Objects are not valid as a React child (found: object with keys {input_documents, output_text})"
      // implies that `response.data.summary` is this object. We need to extract `output_text`.
      if (
        response.data &&
        response.data.summary &&
        typeof response.data.summary.output_text === "string"
      ) {
        setSummary(response.data.summary.output_text);
      } else if (response.data && typeof response.data.summary === "string") {
        // Fallback if for some reason response.data.summary is already a string
        setSummary(response.data.summary);
      } else {
        console.error("Unexpected summary structure from server:", response.data);
        setError(
          "Failed to parse summary from the server response. Expected 'response.data.summary.output_text' to be a string."
        );
        setSummary(""); // Clear summary or indicate an error
      }
    } catch (err) {
      console.error("Error uploading or summarizing file:", err);
      let errorMessage = "Failed to summarize PDF. Please try again.";
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
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-700">
        PDF Summarizer
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4">
          <label
            htmlFor="pdf-upload"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Upload PDF:
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !file}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading || !file ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Summarizing..." : "Summarize"}
          </button>
        </div>
      </form>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {summary && (
        <div className="mt-6 bg-gray-50 shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">
            Summary:
          </h2>
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-gray-800">
              {summary}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfSummarizer;
