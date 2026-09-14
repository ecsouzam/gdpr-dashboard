import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function DataInventoryTable({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        No personal data categories were identified in this document.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Data Category</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Special Category (Art. 9)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Retention Period</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item, index) => (
            <tr key={`${item.category}-${index}`} className={item.sensitive ? "bg-red-50/40" : undefined}>
              <td className="px-4 py-3 font-medium text-gray-800">{item.category}</td>
              <td className="px-4 py-3">
                {item.sensitive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Sensitive
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Standard
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{item.retention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
