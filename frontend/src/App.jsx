import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import FileUploadZone from "./components/FileUploadZone";
import ScoreGauge from "./components/ScoreGauge";
import RiskList from "./components/RiskList";
import DataInventoryTable from "./components/DataInventoryTable";
import LoadingIndicator from "./components/LoadingIndicator";
import { analyzeDocument, ApiError } from "./api";

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setStatus(STATUS.IDLE);
    setResult(null);
    setErrorMessage("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setStatus(STATUS.LOADING);
    setErrorMessage("");

    try {
      const data = await analyzeDocument(selectedFile);
      setResult(data);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setStatus(STATUS.ERROR);
    }
  };

  const highCount = result?.risks?.filter((r) => r.severity === "High").length ?? 0;
  const mediumCount = result?.risks?.filter((r) => r.severity === "Medium").length ?? 0;
  const lowCount = result?.risks?.filter((r) => r.severity === "Low").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">GDPR / DPIA Compliance Dashboard</h1>
            <p className="text-sm text-gray-500">
              AI-powered architecture review against core GDPR principles, running fully on-premise via Ollama.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Upload Architecture Documentation</h2>
          <p className="mb-4 text-sm text-gray-500">
            Upload a system design document, data flow diagram description, or architecture spec.
            The AI auditor will assess it against Lawfulness, Data Minimization, Storage Limitation,
            Security, and Data Subject Rights principles.
          </p>
          <FileUploadZone
            selectedFile={selectedFile}
            onFileSelected={handleFileSelected}
            onAnalyze={handleAnalyze}
            isLoading={status === STATUS.LOADING}
          />
        </section>

        {status === STATUS.LOADING && <LoadingIndicator />}

        {status === STATUS.ERROR && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <p className="font-semibold">Analysis failed</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {status === STATUS.SUCCESS && result && (
          <div className="flex flex-col gap-8">
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ScoreGauge score={result.overall_score} />

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 md:col-span-2">
                <h2 className="mb-2 text-lg font-semibold text-gray-800">Executive Summary</h2>
                <p className="text-sm leading-relaxed text-gray-600">{result.summary}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    {highCount} High
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {mediumCount} Medium
                  </span>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {lowCount} Low
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Compliance Risks</h2>
              <RiskList risks={result.risks} />
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Data Inventory</h2>
              <DataInventoryTable items={result.data_inventory} />
            </section>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-gray-400">
        Analysis performed locally via Ollama (Qwen2.5:7b). No document data leaves your network.
      </footer>
    </div>
  );
}
