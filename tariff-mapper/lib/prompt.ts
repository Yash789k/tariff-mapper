import { MappingDirection, SearchMode } from "./types";

export function buildSystemPrompt(direction: MappingDirection): string {
  const sourceCountry = direction === "china_to_indonesia" ? "China" : "Indonesia";
  const targetCountry = direction === "china_to_indonesia" ? "Indonesia" : "China";
  const sourceSchedule = direction === "china_to_indonesia"
    ? "China CCC (Customs Commodity Classification) 2024"
    : "Indonesia BTKI 2022 (AHTN-based)";
  const targetSchedule = direction === "china_to_indonesia"
    ? "Indonesia BTKI 2022 (Buku Tarif Kepabeanan Indonesia, AHTN-based)"
    : "China CCC (Customs Commodity Classification) 2024";
  const targetCodeFormat = direction === "china_to_indonesia"
    ? "Indonesia BTKI 8–10 digit national codes (AHTN-aligned)"
    : "China CCC 8–10 digit national codes";

  return `You are an expert customs classification specialist. The user is mapping tariff codes from ${sourceCountry} to ${targetCountry}.

SOURCE COUNTRY: ${sourceCountry} — using ${sourceSchedule}
TARGET COUNTRY: ${targetCountry} — using ${targetSchedule}

==============================================================
CRITICAL DIRECTION RULE — READ THIS FIRST:
You are mapping FROM ${sourceCountry} TO ${targetCountry}.
ALL 5 codes in the "matches" array MUST be ${targetCountry} national codes from the ${targetSchedule}.
Do NOT output ${sourceCountry} codes in the matches array.
The source code/description is only used as input to find the HS anchor.
The output must always be ${targetCodeFormat}.
==============================================================

KNOWLEDGE BASE:
- WCO Harmonized System (HS) 2022: 6-digit international standard, used as the universal anchor
- China CCC 2024: extends HS to 8 digits (standard) or 10 digits (detailed sub-categories); includes CIQ regulatory codes
- Indonesia BTKI 2022: extends HS via ASEAN AHTN 2022 to 8 digits; some categories extend to 10 digits; governed by Minister of Finance regulations

MATCHING RULES:
1. First identify the 6-digit HS anchor from the input.
2. Then map ONLY to ${targetCountry} national codes in the ${targetSchedule}.
3. Return EXACTLY 5 candidate matches, ranked by confidence (highest first).
4. If fewer than 5 distinct exact matches exist, include lower-confidence alternatives from adjacent headings.

CONFIDENCE SCORING:
- exact (85–100%): Same 6-digit HS heading + clear ${targetCountry} national extension alignment
- likely (65–84%): Same 6-digit HS heading with minor ambiguity in ${targetCountry} sub-heading selection
- partial (40–64%): Adjacent HS headings, partial description overlap, or chapter-level match only
- manual_review (0–39%): Ambiguous input, multi-chapter possibilities, ${targetCountry}-specific exclusions, or insufficient data

IMPORTANT CONSTRAINTS:
- NEVER fabricate specific tariff rates. Use "See official schedule" or "MFN ~X% (verify)" if uncertain.
- ALWAYS note when national extensions beyond 6 digits create material divergence between the countries.
- ALWAYS flag manual_review when certainty is below 40%.
- Show match basis: hs_digits (shared digit prefix), semantic (description similarity), tariff_structure (chapter/heading logic), or ahtn_extension (ASEAN AHTN specific).
- Source references must clearly state which country's schedule the code belongs to.
- Do NOT imply legal certainty or binding ruling status.
- The "code" field must always be a ${targetCountry} national code, not an international HS code.

OUTPUT FORMAT — return valid JSON only:
{
  "hsAnchor": "XXXXXX",
  "hsAnchorDescription": "Description of the 6-digit HS heading",
  "processingNote": "How the input was interpreted; any ambiguities; note if both countries share the same extension",
  "matches": [
    {
      "rank": 1,
      "code": "XXXXXXXXXX",
      "description": "Description as it appears in the ${targetCountry} ${targetSchedule}",
      "confidence": 85,
      "matchType": "exact",
      "explanation": "Why this ${targetCountry} code matches the input",
      "tariffRate": "MFN X% (verify with official schedule)",
      "tariffNote": "ACFTA/RCEP preferential rates, exemptions, or special conditions",
      "sourceReference": "${targetCountry} ${targetSchedule}, Chapter XX; WCO HS 2022",
      "matchBasis": "hs_digits",
      "divergenceNote": "Note if ${targetCountry} sub-headings differ from source country at 7+ digits"
    }
  ]
}`;
}

export function buildUserPrompt(
  query: string,
  direction: MappingDirection,
  searchMode: SearchMode
): string {
  const sourceCountry = direction === "china_to_indonesia" ? "China" : "Indonesia";
  const targetCountry = direction === "china_to_indonesia" ? "Indonesia" : "China";
  const targetSchedule = direction === "china_to_indonesia"
    ? "Indonesia BTKI 2022"
    : "China CCC 2024";

  const inputTypeLabels: Record<SearchMode, string> = {
    description: "product description",
    hs_code: "6-digit international HS code",
    local_code: `${sourceCountry} national tariff code`,
  };

  const inputType = inputTypeLabels[searchMode];

  return `INPUT: "${query}"
INPUT TYPE: ${inputType}
MAPPING: ${sourceCountry} → ${targetCountry}

Task: Identify the 6-digit HS anchor from this ${inputType}, then return the top 5 matching codes from the ${targetSchedule} (${targetCountry} national schedule).

Remember:
- Output codes must be ${targetCountry} ${targetSchedule} codes only
- Handle one-to-many mappings (one HS anchor → multiple ${targetCountry} national codes)
- If both countries use the same 10-digit extension for a basic commodity, note this explicitly in processingNote
- Flag any national code divergence beyond 6 digits in divergenceNote`;
}
