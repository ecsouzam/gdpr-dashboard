import { AlertCircle, AlertOctagon, AlertTriangle } from "lucide-react";

const SEVERITY_CONFIG = {
  High: {
    cardClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-600 text-white",
    Icon: AlertOctagon,
    iconClass: "text-red-600",
  },
  Medium: {
    cardClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-500 text-white",
    Icon: AlertTriangle,
    iconClass: "text-amber-500",
  },
  Low: {
    cardClass: "border-sky-200 bg-sky-50",
    badgeClass: "bg-sky-500 text-white",
    Icon: AlertCircle,
    iconClass: "text-sky-500",
  },
};

function RiskCard({ risk }) {
  const config = SEVERITY_CONFIG[risk.severity] ?? SEVERITY_CONFIG.Low;
  const { Icon } = config;

  return (
    <div className={`rounded-lg border p-4 ${config.cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} />
          <div>
            <h3 className="font-semibold text-gray-800">{risk.title}</h3>
            {risk.category && (
              <span className="mt-0.5 inline-block text-xs font-medium text-gray-500">{risk.category}</span>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}>
          {risk.severity}
        </span>
      </div>
      <p className="mt-2 pl-7 text-sm text-gray-700">{risk.description}</p>
      <div className="mt-3 ml-7 rounded-md bg-white/70 p-3 text-sm">
        <span className="font-medium text-gray-800">Recommendation: </span>
        <span className="text-gray-600">{risk.recommendation}</span>
      </div>
    </div>
  );
}

export default function RiskList({ risks }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        No compliance risks were identified in this document.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {risks.map((risk, index) => (
        <RiskCard key={`${risk.title}-${index}`} risk={risk} />
      ))}
    </div>
  );
}
