import { MatchType } from "@/lib/types";

interface Props {
  confidence: number;
  matchType: MatchType;
  size?: "sm" | "md";
}

const config: Record<MatchType, {
  label: string;
  dot: string;
  badge: string;
  bar: string;
  border: string;
}> = {
  exact: {
    label: "Exact Match",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    border: "border-l-emerald-500",
  },
  likely: {
    label: "Likely Match",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-gradient-to-r from-blue-400 to-blue-500",
    border: "border-l-blue-500",
  },
  partial: {
    label: "Partial Match",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-gradient-to-r from-amber-400 to-amber-500",
    border: "border-l-amber-500",
  },
  manual_review: {
    label: "Manual Review",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-gradient-to-r from-red-400 to-red-500",
    border: "border-l-red-400",
  },
};

export { config as matchConfig };

export default function ConfidenceBadge({ confidence, matchType, size = "md" }: Props) {
  const c = config[matchType];

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
      <div className="flex items-center gap-2">
        <div className={`rounded-full bg-gray-100 overflow-hidden ${size === "sm" ? "w-16 h-1" : "w-24 h-1.5"}`}>
          <div
            className={`h-full rounded-full confidence-bar ${c.bar}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-700 tabular-nums w-8 text-right">
          {confidence}%
        </span>
      </div>
    </div>
  );
}
