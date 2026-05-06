# TariffMapper — Build Documentation

**Project:** Automated China–Indonesia Tariff Code Mapping Web App  
**Client:** Tsunami Advisors (AI Intern Case Study)  
**Status:** MVP Complete · v1.0  
**Date:** May 2026  

---

## 1. Project Overview

TariffMapper is a Generative AI-first prototype web application that maps import and export product classification codes between China and Indonesia. A user enters a product description, HS code, or national tariff code, and the system returns the top 5 most likely classification matches in the target country — each with a confidence score, match type label, tariff rate indicator, explanation of match logic, and source citation.

The system is designed to handle:
- **One-to-many mappings** — a single HS anchor can expand to multiple national codes
- **Ambiguous or vague descriptions** — GPT-4o resolves natural language into HS anchors
- **National code divergence** — differences between China (CCC 8–10 digit extensions) and Indonesia (BTKI/AHTN 8–10 digit extensions) beyond the 6-digit international standard
- **Low-certainty cases** — flagged explicitly as "manual review required"

---

## 2. Tools and Technology Stack

| Layer | Tool / Library | Purpose |
|---|---|---|
| **AI Engine** | OpenAI GPT-4o | Core mapping logic, semantic search, explanation generation |
| **Frontend Framework** | Next.js 16 (App Router) | React-based web application, SSR + static pages |
| **Styling** | Tailwind CSS | Utility-first CSS, responsive layout |
| **Language** | TypeScript | Type safety across frontend and API |
| **Backend** | Next.js API Routes (serverless) | `/api/map` POST endpoint |
| **Database / Cache** | Supabase (PostgreSQL) | Search history logging + result caching |
| **Deployment** | Vercel (recommended) | Zero-config Next.js deployment |

### Why GPT-4o?

GPT-4o was selected over a rules-based or database lookup approach for the following reasons:

1. **No publicly available bilateral mapping database** exists between CCC and BTKI with full coverage — a structured DB approach would require building one from scratch.
2. **Natural language inputs** (product descriptions) require semantic understanding, not exact-match lookup.
3. **JSON mode (`response_format: json_object`)** ensures structured, parseable output every time with low temperature (0.1) for consistent results.
4. **Explainability** — the AI can articulate *why* a code was matched, not just what it matched to.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────┐
│                   Browser (React)                  │
│  SearchForm → POST /api/map → ResultCards display  │
└───────────────────────┬──────────────────────────┘
                        │ fetch()
┌───────────────────────▼──────────────────────────┐
│           Next.js API Route (/api/map)             │
│   1. Validate input                                │
│   2. Check Supabase cache (cache_key lookup)       │
│   3. If miss → call OpenAI GPT-4o                  │
│   4. Cache result + log search history             │
│   5. Return MappingResponse JSON                   │
└────────────────┬──────────────────┬───────────────┘
                 │                  │
    ┌────────────▼────┐   ┌─────────▼──────────┐
    │  OpenAI GPT-4o  │   │  Supabase (PG)     │
    │  gpt-4o         │   │  mappings_cache     │
    │  JSON mode      │   │  search_history     │
    │  temp=0.1       │   └────────────────────┘
    └─────────────────┘
```

**Request lifecycle:**
1. User submits query, direction, and search mode
2. API route checks Supabase `mappings_cache` by a normalised cache key (`direction::query`)
3. On cache miss, the system prompt + user prompt are sent to GPT-4o with `json_object` response format
4. The response is parsed, cached in Supabase, and search metadata is logged to `search_history`
5. Client renders the `MappingResponse` with ResultCards, ConfidenceBadge, and expandable detail rows

---

## 4. Key Prompts and Prompt Engineering

### 4.1 System Prompt Design

The system prompt encodes deep domain knowledge across three areas:

**HS Nomenclature Context**
- WCO HS 2022 6-digit structure and chapter organisation
- China CCC 2024 national extension conventions (8 and 10 digits)
- Indonesia BTKI 2022 structure derived from ASEAN AHTN 2022

**Scoring Rubric**

| Tier | Score | Label | Criteria |
|---|---|---|---|
| Tier 1 | 85–100% | exact | Direct 6-digit match + clear national extension alignment |
| Tier 2 | 65–84% | likely | 6-digit match with minor ambiguity in national sub-heading |
| Tier 3 | 40–64% | partial | Adjacent HS codes, partial description overlap, chapter-level only |
| Tier 4 | 0–39% | manual_review | Ambiguous input, multi-chapter possibilities, or country exclusions |

**Output Contract**
The prompt specifies a strict JSON contract (`hsAnchor`, `hsAnchorDescription`, `processingNote`, `matches[]`) and enforces:
- `NEVER fabricate tariff rates` — rates must be flagged as "verify with official schedule"
- `ALWAYS note national divergence` beyond 6 digits
- `ALWAYS flag manual_review` below 40% confidence
- 4 match basis types: `hs_digits`, `semantic`, `tariff_structure`, `ahtn_extension`

### 4.2 Prompt Iterations

**v1 (initial):** Simple instruction to "map HS codes between China and Indonesia." 
- Problem: AI returned free text, not structured JSON, and fabricated tariff rates.

**v2:** Added JSON schema specification and "do not fabricate" constraints.  
- Problem: Confidence scores were inconsistently calibrated (all results were 90%+).

**v3:** Added tiered confidence rubric and source citation requirements.
- Problem: AI conflated the 6-digit anchor with national codes.

**v4 (final):** Explicit instruction to identify the HS anchor first, then derive national codes. Added `match_basis` enum and `divergenceNote` field. Temperature set to 0.1.
- Result: Consistent, structured, calibrated output with traceable match logic.

### 4.3 Direction enforcement (post-MVP refinement)

The system prompt is now built per request via `buildSystemPrompt(direction)` so the **source and target countries are fixed in the system message**, not only in the user message.

A **CRITICAL DIRECTION RULE** block requires that **every code in `matches[]` is a national code from the target country's schedule** (Indonesia BTKI when mapping China → Indonesia; China CCC when mapping Indonesia → China). The model must not echo source-country codes in the results array.

This addressed user-reported cases where Indonesia → China still showed Indonesian-style outputs. **Note:** For some commodities (e.g. crude palm oil), China and Indonesia may legitimately share the same 10-digit extension — the `processingNote` field should state when that is expected rather than an error.

---

## 5. Data Sources

| Source | URL / Reference | Why Selected |
|---|---|---|
| WCO HS 2022 Nomenclature | wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition.aspx | International standard — 6-digit anchor for all mappings |
| China CCC Tariff Schedule 2024 | tariff.customs.gov.cn (China Customs official portal) | Source of 8–10 digit CCC national extensions and MFN rates |
| Indonesia BTKI 2022 | insw.go.id / beacukai.go.id | Indonesia's official tariff book; AHTN-based 8–10 digit codes |
| ASEAN AHTN 2022 | asean.org/asean-economic-community/asean-harmonised-tariff-nomenclature-ahtn/ | Governs Indonesia and ASEAN national extensions at 8 digits |
| ACFTA Tariff Schedule | ASEAN-China FTA official schedules | Preferential tariff rates for bilateral trade |
| RCEP Tariff Schedule | rcepsec.org | Reduced MFN rates under RCEP (effective 2022) |

**Why public sources only:** Per the assignment constraints, no non-public customs databases or fabricated data are used. The GPT-4o model was trained on publicly available customs documentation and trade resources up to its knowledge cutoff.

---

## 6. Matching Logic and Ranking Methodology

### 6.1 Matching Pipeline

```
Input (description / HS code / local code)
    │
    ▼
Step 1: Anchor Resolution
  AI identifies the 6-digit HS heading
  (e.g., "laptop computer" → 847130 "Portable digital ADP machines")
    │
    ▼
Step 2: National Extension Mapping
  AI maps the 6-digit anchor to the target country's
  8–10 digit national codes using:
  - Shared digit prefix (most reliable)
  - Semantic description comparison
  - Chapter/heading structural rules
  - AHTN 2022 extension patterns (for Indonesia)
    │
    ▼
Step 3: One-to-Many Expansion
  A single 6-digit anchor may map to multiple national codes
  (e.g., China sub-divides 847130 into codes by display technology,
  while Indonesia uses fewer sub-headings)
    │
    ▼
Step 4: Confidence Scoring and Ranking
  Each candidate scored using the tiered rubric;
  ranked highest to lowest confidence
    │
    ▼
Step 5: Divergence Detection
  AI checks whether national extensions create
  material classification divergence beyond 6 digits
  (flagged in divergenceNote field)
```

### 6.2 Fuzzy Description Handling

When a product description is incomplete or vague (e.g., "industrial pump" — which could be Chapter 84 hydraulic pumps, or Chapter 39 plastic pumps, or Chapter 73 steel pumps), the system:
1. Identifies all plausible HS chapters and headings
2. Returns candidates spanning the range of interpretations
3. Sets lower confidence scores to reflect the ambiguity
4. Notes the ambiguity in `processingNote` so the user understands why matches span multiple chapters

### 6.3 National Code Divergence Handling

China and Indonesia both extend from the 6-digit international standard but use different national sub-headings. Examples:
- **Chapter 85 (Electrical equipment):** China's CCC adds detailed sub-categories by wattage, voltage, and application; Indonesia's BTKI follows AHTN which uses broader groupings
- **Chapter 15 (Animal/vegetable fats):** Indonesia has specific BTKI codes for CPO (crude palm oil) grades that do not have direct Chinese CCC equivalents
- **Chapter 84 (Machinery):** Both countries add national extensions but diverge at the 8-digit level for specific automation equipment

These divergences are explicitly noted in the `divergenceNote` field of each result.

---

## 7. Supabase Database Schema

```sql
-- Cache for AI mapping results (avoids re-calling OpenAI for identical queries)
CREATE TABLE mappings_cache (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key   TEXT UNIQUE NOT NULL,  -- "direction::normalised_query"
  result      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Search history log for analytics and audit trail
CREATE TABLE search_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query       TEXT NOT NULL,
  direction   TEXT NOT NULL,          -- 'china_to_indonesia' | 'indonesia_to_china'
  search_mode TEXT NOT NULL,          -- 'description' | 'hs_code' | 'local_code'
  hs_anchor   TEXT,                   -- 6-digit anchor returned by AI
  result_count INTEGER,               -- Number of matches returned
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (recommended for production)
ALTER TABLE mappings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
```

**Caching strategy:** Cache key is `direction::normalised_query` (lowercased, trimmed). This deduplicates identical queries regardless of capitalisation. Cache is write-once / read-first per session.

---

## 8. Limitations and Unresolved Classification Risks

### Hard Limitations

1. **AI knowledge cutoff** — GPT-4o's training data has a cutoff date. Tariff schedules updated after the cutoff (e.g., CCC 2025 amendments, BTKI revisions) may not be reflected.
2. **No real-time tariff rate lookup** — Actual MFN, ACFTA, and RCEP rates require live queries to official tariff portals. The app flags rates as "verify with official schedule."
3. **No binding ruling authority** — Classification suggestions are informational only and do not constitute a binding advance ruling from China Customs or Bea Cukai Indonesia.
4. **10-digit precision gaps** — At the 10-digit level, China's CCC has product-specific sub-classifications (e.g., by CIQ inspection categories) that the AI cannot reliably map without real-time database access.

### Unresolved Classification Risks

- **Dual-use goods** — Items with both civilian and military applications (Chapter 84–90) may trigger additional export licensing requirements not captured in standard tariff codes
- **Chapter 98 / Special provisions** — Country-specific provisions and special purpose codes are difficult to systematically map through the AI
- **Recent HS amendments** — HS 2022 introduced structural changes (e.g., Chapter 87 EV battery cell additions) that may not be consistently reflected in national schedule synchronisation

---

## 9. What AI Did Well vs. What Required Human Judgment

### AI Strengths

| Capability | Assessment |
|---|---|
| Semantic understanding of product descriptions | Excellent — correctly anchors vague descriptions to HS headings |
| One-to-many mapping generation | Good — reliably returns 5 candidates covering the range of national codes |
| Explainability | Strong — articulates match basis and divergence logic in natural language |
| Ambiguity flagging | Good — consistently uses manual_review label for uncertain cases |
| Handling incomplete inputs | Good — generates reasonable candidates with appropriate confidence scaling |

### Human Judgment Required

| Area | Reason |
|---|---|
| Exact tariff rate verification | AI cannot query live rate databases; rates must be confirmed with official schedules |
| 10-digit national sub-code selection | Micro-level sub-classifications require specialist knowledge of specific product characteristics |
| Chapter 98 special provisions | Country-specific exemptions, quota regimes, and anti-dumping codes require human review |
| Regulatory compliance context | Import licensing, CCC certification requirements, and SPS measures are outside the tariff mapping scope |
| Binding ruling decisions | Only customs authorities can issue binding classification rulings |

---

## 10. Deployment Guide (Vercel + Supabase)

### Step 1: Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from Section 7 above
3. Go to **Settings → API** and copy your Project URL and `anon/public` key

### Step 2: Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key (requires at minimum Tier 1 access for GPT-4o)
3. Estimated cost: ~$0.01–0.03 per search query (GPT-4o input + output tokens)

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From the tariff-mapper directory
cd tariff-mapper
vercel deploy

# Set environment variables in Vercel dashboard:
# OPENAI_API_KEY=sk-...
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 4: Local Development

```bash
cp .env.local.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
# Open http://localhost:3000
```

---

## 11. Reflection

### What Worked Best
The GPT-4o JSON mode approach was highly effective for this use case. The combination of a detailed system prompt encoding domain expertise (HS structure, national extension logic, confidence rubric) with strict JSON output constraints produced consistent, structured results that could be rendered directly in the UI without post-processing. The caching layer via Supabase significantly improved response times for repeated queries, which is critical for a demo environment.

### Where Ambiguity and Weak Matching Appeared
The most challenging queries were: (1) multi-chapter products like "smart home devices" which span chapters 85, 84, and 90 depending on primary function; (2) commodity-specific codes like Indonesian CPO grades that have no direct Chinese CCC equivalent; and (3) chemical and pharmaceutical codes where 6-digit anchors map to dozens of national sub-headings on both sides.

### What I Would Improve in the Next Version
1. **Integrate live tariff rate APIs** — China Customs and Indonesia Bea Cukai both expose tariff schedule data via web portals; scraping or official API access would enable real-time rate lookup.
2. **Build a bilateral crosswalk database** — Train a fine-tuned model or build a vector similarity index on bilingual tariff schedule embeddings for higher precision matching.
3. **Add chapter/heading browser** — Allow users to navigate the HS tree directly, not just search by keyword.
4. **Batch mapping mode** — Accept CSV uploads of HS codes for bulk bilateral mapping workflows.
5. **Admin analytics dashboard** — Supabase search history enables analysis of most-searched codes and low-confidence categories, which can guide data quality improvements.
