import { useCallback, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

function isAcceptedFile(file) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function FileUploadZone({ selectedFile, onFileSelected, onAnalyze, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState("");
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (!file) return;

      if (!isAcceptedFile(file)) {
        setDragError("Unsupported file type. Please upload a .pdf, .docx, or .txt file.");
        return;
      }

      setDragError("");
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-10 w-10 text-indigo-600" />
            <p className="font-medium text-gray-800">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB &middot; click or drop to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-10 w-10 text-gray-400" />
            <p className="font-medium text-gray-700">
              Drag &amp; drop your architecture documentation here
            </p>
            <p className="text-sm text-gray-500">or click to browse &middot; PDF, DOCX, or TXT</p>
          </div>
        )}
      </div>

      {dragError && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <X className="h-4 w-4" /> {dragError}
        </p>
      )}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!selectedFile || isLoading}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? "Analyzing document..." : "Run GDPR Compliance Analysis"}
      </button>
    </div>
  );
}
