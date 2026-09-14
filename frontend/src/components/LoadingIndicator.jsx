import { Loader2 } from "lucide-react";

export default function LoadingIndicator({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white p-10 shadow-sm ring-1 ring-gray-200">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="font-medium text-gray-700">{message || "Analyzing document..."}</p>
      <p className="max-w-sm text-center text-sm text-gray-500">
        The local Qwen2.5:7b model is reviewing your document against core GDPR principles.
        This may take a minute depending on document length.
      </p>
    </div>
  );
}
