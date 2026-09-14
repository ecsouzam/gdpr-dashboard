import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

function getScoreProfile(score) {
  if (score >= 80) {
    return {
      label: "Good Compliance",
      colorClass: "text-emerald-500",
      trackClass: "stroke-emerald-500",
      badgeClass: "bg-emerald-100 text-emerald-700",
      Icon: ShieldCheck,
    };
  }
  if (score >= 50) {
    return {
      label: "Needs Improvement",
      colorClass: "text-amber-500",
      trackClass: "stroke-amber-500",
      badgeClass: "bg-amber-100 text-amber-700",
      Icon: ShieldQuestion,
    };
  }
  return {
    label: "High Risk",
    colorClass: "text-red-500",
    trackClass: "stroke-red-500",
    badgeClass: "bg-red-100 text-red-700",
    Icon: ShieldAlert,
  };
}

export default function ScoreGauge({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const profile = getScoreProfile(clamped);
  const { Icon } = profile;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} strokeWidth="12" className="fill-none stroke-gray-100" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="12"
            strokeLinecap="round"
            className={`score-ring-fill fill-none ${profile.trackClass}`}
            style={{
              "--circumference": circumference,
              "--offset": offset,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${profile.colorClass}`}>{clamped}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${profile.badgeClass}`}>
        <Icon className="h-4 w-4" />
        {profile.label}
      </div>
      <p className="text-center text-sm text-gray-500">Overall GDPR/DPIA Compliance Score</p>
    </div>
  );
}
