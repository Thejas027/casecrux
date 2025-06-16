import React from "react";
import Button from "../../common/Button";
import FileInput from "../../common/FileInput";

const PdfUploadForm = ({ onFileChange, onSubmit, file, isLoading, caseId }) => {
  const handleFormSubmit = (event) => {
    event.preventDefault();
    onSubmit(caseId); // Pass caseId from local state if used, or directly from props
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-8 border-2 border-[#7f5af0]"
    >
      {/* Optional: Case ID input if you want to associate a case ID during single upload */}
      {/* <div className="mb-6">
        <label htmlFor="case-id-single" className="block text-[#7f5af0] text-lg font-bold mb-2">
          Case ID (Optional):
        </label>
        <input
          id="case-id-single"
          type="text"
          value={caseId} // Assuming caseId state is managed in the parent or this component
          // onChange={onCaseIdChange} // Assuming handler is passed from parent
          placeholder="e.g., initial-report-case-001"
          className="shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#18181b] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0] text-lg"
        />
      </div> */}
      <div className="mb-6">
        <label
          htmlFor="pdf-upload"
          className="block text-[#7f5af0] text-lg font-bold mb-2"
        >
          Upload PDF:
        </label>
        <FileInput
          id="pdf-upload"
          accept="application/pdf"
          onChange={(e) => onFileChange(e.target.files[0])}
        />
      </div>
      <div className="flex items-center justify-start">
        <Button type="submit" disabled={isLoading || !file} variant="primary">
          {isLoading ? "Summarizing..." : "Summarize PDF"}
        </Button>
      </div>
    </form>
  );
};

export default PdfUploadForm;
