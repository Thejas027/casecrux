import FileInput from "../../common/FileInput";
import Button from "../../common/Button";

const MultiPdfUploadForm = ({
  files,
  caseId,
  onFilesChange,
  onCaseIdChange,
  onSubmit,
  isLoading,
}) => {
  const handleFormSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 mb-6 border-2 border-[#7f5af0]"
    >
      <div className="mb-6">
        <label
          htmlFor="case-id-multi"
          className="block text-[#7f5af0] text-lg font-bold mb-2"
        >
          Case ID:
        </label>
        <input
          id="case-id-multi"
          type="text"
          value={caseId}
          onChange={(e) => onCaseIdChange(e.target.value)}
          placeholder="e.g., complex-fraud-case-007"
          className="text-lg"
        />
      </div>
      <div className="mb-6">
        <label
          htmlFor="pdfs-multi"
          className="block text-[#7f5af0] text-lg font-bold mb-2"
        >
          Upload PDFs (Select Multiple):
        </label>
        <FileInput
          id="pdfs-multi"
          accept="application/pdf"
          multiple
          onChange={(e) => onFilesChange(e.target.files)}
          className="text-lg"
        />
      </div>
      <div className="flex items-center justify-start">
        <Button
          type="submit"
          disabled={isLoading || !caseId || !files || files.length === 0}
          variant="primary"
        >
          {isLoading ? "Processing Multiple PDFs..." : "Summarize All Selected"}
        </Button>
      </div>
    </form>
  );
};

export default MultiPdfUploadForm;
