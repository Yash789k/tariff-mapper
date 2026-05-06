export type MatchType = "exact" | "likely" | "partial" | "manual_review";
export type MatchBasis =
  | "hs_digits"
  | "semantic"
  | "tariff_structure"
  | "ahtn_extension";
export type MappingDirection = "china_to_indonesia" | "indonesia_to_china";
export type SearchMode = "description" | "hs_code" | "local_code";

export interface TariffMatch {
  rank: number;
  code: string;
  description: string;
  confidence: number;
  matchType: MatchType;
  explanation: string;
  tariffRate: string;
  tariffNote: string;
  sourceReference: string;
  matchBasis: MatchBasis;
  divergenceNote: string;
}

export interface MappingRequest {
  query: string;
  direction: MappingDirection;
  searchMode: SearchMode;
}

export interface MappingResponse {
  query: string;
  direction: MappingDirection;
  hsAnchor: string;
  hsAnchorDescription: string;
  matches: TariffMatch[];
  processingNote: string;
  cached?: boolean;
}

export interface SearchHistoryEntry {
  id?: string;
  query: string;
  direction: MappingDirection;
  search_mode: SearchMode;
  hs_anchor: string;
  result_count: number;
  created_at?: string;
}
