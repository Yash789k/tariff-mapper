"use client";

import { useState } from "react";
import { MappingDirection, SearchMode } from "@/lib/types";

interface Props {
  onSearch: (query: string, direction: MappingDirection, mode: SearchMode) => void;
  loading: boolean;
}

const examples: Record<SearchMode, string[]> = {
  description: ["crude palm oil", "lithium ion battery cells", "laptop computer", "woven cotton fabric"],
  hs_code: ["151110", "847130", "854360", "870380"],
  local_code: ["1511100000", "8471301000", "8507600090"],
};

const searchModes: { value: SearchMode; label: string; short: string }[] = [
  { value: "description", label: "Product Description", short: "Description" },
  { value: "hs_code", label: "HS Code (6-digit)", short: "HS Code" },
  { value: "local_code", label: "Local National Code", short: "Local Code" },
];

export default function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<MappingDirection>("china_to_indonesia");
  const [searchMode, setSearchMode] = useState<SearchMode>("description");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), direction, searchMode);
  }

  const placeholder =
    searchMode === "description"
      ? "e.g. crude palm oil, EV battery cells, cotton fabric..."
      : searchMode === "hs_code"
      ? "e.g. 151110, 847130, 870380"
      : direction === "china_to_indonesia"
      ? "e.g. 8471301000 (China CCC)"
      : "e.g. 1511100000 (Indonesia BTKI)";

  const inputLabel =
    searchMode === "description"
      ? "Product Description"
      : searchMode === "hs_code"
      ? "HS Code (6-digit international)"
      : direction === "china_to_indonesia"
      ? "China CCC Code"
      : "Indonesia BTKI Code";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Direction toggle */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Mapping Direction
        </label>
        <div className="grid grid-cols-2 gap-2">
          <DirectionButton
            active={direction === "china_to_indonesia"}
            onClick={() => setDirection("china_to_indonesia")}
            from={{ flag: "🇨🇳", label: "China" }}
            to={{ flag: "🇮🇩", label: "Indonesia" }}
          />
          <DirectionButton
            active={direction === "indonesia_to_china"}
            onClick={() => setDirection("indonesia_to_china")}
            from={{ flag: "🇮🇩", label: "Indonesia" }}
            to={{ flag: "🇨🇳", label: "China" }}
          />
        </div>
      </div>

      {/* Search mode tabs */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Input Type
        </label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-0.5 gap-0.5">
          {searchModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => { setSearchMode(mode.value); setQuery(""); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                searchMode === mode.value
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mode.short}
            </button>
          ))}
        </div>
      </div>

      {/* Query input */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          {inputLabel}
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-white placeholder-gray-300 transition-all text-gray-900"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {examples[searchMode].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="w-full py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mapping codes…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Tariff Matches
          </>
        )}
      </button>
    </form>
  );
}

function DirectionButton({
  active,
  onClick,
  from,
  to,
}: {
  active: boolean;
  onClick: () => void;
  from: { flag: string; label: string };
  to: { flag: string; label: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
        active
          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span>{from.flag}</span>
      <svg className={`w-3 h-3 ${active ? "text-blue-200" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <span>{to.flag}</span>
      <span className="ml-0.5 opacity-80">{to.label}</span>
    </button>
  );
}
