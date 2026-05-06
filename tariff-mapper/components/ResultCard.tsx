"use client";

import { useState } from "react";
import { TariffMatch } from "@/lib/types";
import ConfidenceBadge, { matchConfig } from "./ConfidenceBadge";

const matchBasisLabels: Record<string, { label: string; icon: string }> = {
  hs_digits: { label: "Shared HS digit prefix", icon: "🔢" },
  semantic: { label: "Semantic description similarity", icon: "💬" },
  tariff_structure: { label: "Chapter / heading structure", icon: "📋" },
  ahtn_extension: { label: "ASEAN AHTN extension logic", icon: "🌏" },
};

const rankColors = ["bg-gray-900", "bg-gray-700", "bg-gray-500", "bg-gray-400", "bg-gray-300"];
const rankTextColors = ["text-white", "text-white", "text-white", "text-white", "text-gray-600"];

interface Props {
  match: TariffMatch;
  index: number;
}

export default function ResultCard({ match, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = matchConfig[match.matchType].border;
  const basisInfo = matchBasisLabels[match.matchBasis] ?? { label: match.matchBasis, icon: "•" };

  return (
    <div className={`result-card bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4 ${borderColor}`}>
      {/* Main row */}
      <div className="p-4 flex items-start gap-3">
        {/* Rank bubble */}
        <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center mt-0.5 ${rankColors[index]} ${rankTextColors[index]}`}>
          {index + 1}
        </span>

        {/* Code + description */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-lg font-bold text-gray-900 tracking-wider leading-none">
              {match.code}
            </span>
            {match.tariffRate && match.tariffRate !== "N/A" && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {match.tariffRate}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 leading-snug font-medium">
            {match.description}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
            {match.explanation}
          </p>
        </div>

        {/* Confidence — right side */}
        <div className="flex-shrink-0 ml-2">
          <ConfidenceBadge confidence={match.confidence} matchType={match.matchType} />
        </div>
      </div>

      {/* Metadata strip */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
          {basisInfo.icon}
          <span>{basisInfo.label}</span>
        </span>
        {match.sourceReference && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
            📚 {match.sourceReference}
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wide hover:bg-gray-50 hover:text-gray-600 transition-colors"
      >
        <span>{expanded ? "Hide details" : "Show tariff & divergence details"}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="detail-expand border-t border-gray-100 bg-gray-50/50 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {match.tariffNote && match.tariffNote !== "N/A" && (
            <DetailBlock icon="💰" label="Tariff Notes" value={match.tariffNote} />
          )}
          {match.divergenceNote && match.divergenceNote !== "N/A" && (
            <DetailBlock icon="⚠️" label="Divergence Note" value={match.divergenceNote} warn />
          )}
          <DetailBlock icon="📖" label="Full Explanation" value={match.explanation} span />
        </div>
      )}
    </div>
  );
}

function DetailBlock({
  icon,
  label,
  value,
  warn,
  span,
}: {
  icon: string;
  label: string;
  value: string;
  warn?: boolean;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
        <span>{icon}</span> {label}
      </p>
      <p className={`text-xs leading-relaxed rounded-lg px-2.5 py-2 ${
        warn
          ? "text-amber-800 bg-amber-50 border border-amber-200"
          : "text-gray-600 bg-white border border-gray-200"
      }`}>
        {value}
      </p>
    </div>
  );
}
