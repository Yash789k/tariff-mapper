# Phase 01 — MVP Build Log

**Status:** ✅ Complete  
**Date:** May 2026  
**Objective:** Design, build, and ship a functional prototype web application for China–Indonesia tariff code mapping, powered by GPT-4o, with Supabase backend and Vercel-ready deployment.

---

## 1. Objective & Scope

From the case study brief:

> Create a prototype web app that maps tariff and customs classification codes between China and Indonesia. Users should be able to search by product description, HS code, or local tariff code. The app must return the top 5 most likely code matches for the other country, ranked by confidence or probability.

This phase covers the complete MVP build:
- Core AI mapping engine (OpenAI GPT-4o)
- Full REST API layer (Next.js API routes)
- Responsive frontend UI (React + Tailwind CSS)
- Supabase caching and search history persistence
- Production build and Vercel deployment readiness

**Scope boundaries:** This MVP focuses on the bidirectional China ↔ Indonesia mapping workflow. It does not include real-time tariff rate APIs, binding ruling generation, or multi-country support.

---

## 2. Domain Research & Data Sources

### 2.1 HS Code Structure

The Harmonized System (HS) is a 6-digit international nomenclature administered by the World Customs Organization (WCO). It provides the universal anchor for bilateral code mapping:

```
HS Code Structure:
  XX       — Chapter (2 digits)
  XXXX     — Heading (4 digits)
  XXXXXX   — Subheading (6 digits) ← universal anchor
  XXXXXXXX — National heading (8 digits) ← country-specific
  XXXXXXXXXX — National sub-heading (10 digits) ← country-specific
```

### 2.2 China CCC (Customs Commodity Classification)

- **Official source:** China Customs General Administration, tariff.customs.gov.cn
- **Structure:** 8-digit standard; some categories extend to 10 digits
- **National additions:** CIQ (China Inspection and Quarantine) sub-codes; regulatory categories; specific energy ratings
- **Version:** CCC 2024 (effective January 2024)
- **MFN rates:** Published alongside each code in the official schedule

### 2.3 Indonesia BTKI (Buku Tarif Kepabeanan Indonesia)

- **Official source:** Direktorat Jenderal Bea dan Cukai (Bea Cukai), beacukai.go.id; INSW portal, insw.go.id
- **Structure:** Based on ASEAN Harmonised Tariff Nomenclature (AHTN) 2022
- **AHTN basis:** 8-digit structure; Indonesia adds national sub-headings at digits 9–10 in some categories
- **Version:** BTKI 2022 (aligned to AHTN 2022 and HS 2022)
- **MFN rates:** Published in Minister of Finance Regulation (PMK)

### 2.4 Key Divergence Points Identified

| Chapter | Area | China CCC | Indonesia BTKI | Divergence |
|---|---|---|---|---|
| 15 | Palm oil and fractions | Broad categories | Specific CPO, RBD, olein sub-headings | Indonesia highly granular for palm commodities |
| 84 | Industrial machinery | Sub-divided by automation type, CNC status | Broader AHTN-aligned groupings | CN more granular for high-tech machinery |
| 85 | Electrical equipment | Sub-divided by wattage, voltage ranges | AHTN-based, fewer sub-divisions | CN more granular |
| 87 | Vehicles, EV batteries | New EV-specific codes added CCC 2024 | Aligned to HS 2022 but fewer sub-headings | Recent divergence for EV-related goods |
| 30 | Pharmaceuticals | CIQ regulatory sub-codes | Drug registration-aligned codes | Both countries add regulatory layer |

---

## 3. Project Structure Built

```
TsunamiAdvisorsAIHK/
├── tariff-mapper/                    # Next.js 16 web application
│   ├── app/
│   │   ├── layout.tsx                # Root layout, Inter font, metadata
│   │   ├── page.tsx                  # Main search + results page (client component)
│   │   ├── globals.css               # Tailwind base styles
│   │   └── api/
│   │       └── map/
│   │           └── route.ts          # POST /api/map — core mapping endpoint
│   ├── components/
│   │   ├── Header.tsx                # Branding, data source badges
│   │   ├── SearchForm.tsx            # Direction toggle, search mode, query input, examples
│   │   ├── ResultCard.tsx            # Expandable match card with rank, code, description
│   │   └── ConfidenceBadge.tsx       # Tiered confidence indicator with progress bar
│   ├── lib/
│   │   ├── types.ts                  # Full TypeScript type definitions
│   │   ├── prompt.ts                 # System prompt + user prompt builders
│   │   ├── openai.ts                 # GPT-4o integration with lazy client
│   │   └── supabase.ts               # Caching + history logging
│   ├── .env.local.example            # Environment variable template
│   ├── next.config.ts                # Next.js configuration
│   ├── package.json                  # Dependencies and scripts
│   └── tsconfig.json                 # TypeScript configuration
└── docs/
    ├── BUILD_DOCUMENTATION.md        # 4-page technical build documentation
    ├── MVP_TASKLIST.md               # Phase-by-phase task tracker
    └── PHASE_01_LOG.md               # This file — engineering build log
```

---

## 4. Module Design

### 4.1 `lib/types.ts` — Type System

All data contracts are defined as TypeScript interfaces and union types:

```typescript
// Match confidence tiers from the case study spec
type MatchType = "exact" | "likely" | "partial" | "manual_review";

// How the match was derived (traceable logic layer)
type MatchBasis = "hs_digits" | "semantic" | "tariff_structure" | "ahtn_extension";

// Bidirectional support (case study requirement)
type MappingDirection = "china_to_indonesia" | "indonesia_to_china";

// All three input types from the spec
type SearchMode = "description" | "hs_code" | "local_code";
```

The `TariffMatch` interface captures all required result fields:
- `code` — Full national code (8–10 digits)
- `confidence` — 0–100 numeric score
- `matchType` — Tier label from the confidence rubric
- `explanation` — Human-readable match rationale
- `tariffRate` — Rate indicator (always flagged for official verification)
- `sourceReference` — Citable public source
- `matchBasis` — One of the 4 traceable logic types
- `divergenceNote` — Country-specific divergence beyond 6 digits

### 4.2 `lib/prompt.ts` — AI Prompt Engineering

Two functions compose the OpenAI request:

**`buildSystemPrompt()`** — domain knowledge and output contract:
- Encodes HS 2022, China CCC 2024, and Indonesia BTKI 2022 structural knowledge
- Defines the 4-tier confidence scoring rubric with numeric boundaries
- Specifies the exact JSON output schema with all required fields
- Enforces anti-hallucination constraints (no fabricated rates, no binding rulings)
- Lists the 4 `matchBasis` types for traceable match logic

**`buildUserPrompt(query, direction, searchMode)`** — contextualised request:
- Adapts language based on direction (CN→ID vs ID→CN)
- Labels the input type clearly (description / HS code / local code)
- Instructs the AI to handle one-to-many mappings and flag divergences

### 4.3 `lib/openai.ts` — AI Client

Key implementation decisions:

**Lazy client instantiation:** The `getClient()` function creates the OpenAI client only at request time, not at module load. This is necessary because Next.js evaluates module-level code during the static generation phase of `npm run build`, which would throw an error when `OPENAI_API_KEY` is not set in the build environment.

**Model selection:** `gpt-4o` was selected over `gpt-4-turbo` for:
- Higher accuracy on structured JSON output
- Better multilingual understanding (Chinese and Indonesian product descriptions)
- Larger context window for complex classification queries

**Temperature:** Set to `0.1` (near-deterministic) to ensure consistent, reproducible results for the same query. Tariff classification should be deterministic, not creative.

**Response format:** `{ type: "json_object" }` ensures the model always returns valid JSON, eliminating the need for complex parsing or retry logic.

### 4.4 `lib/supabase.ts` — Caching Layer

**Cache key design:** `"direction::normalised_query"` where normalised_query is lowercased and trimmed. This ensures:
- "Laptop Computer" and "laptop computer" hit the same cache entry
- China→Indonesia and Indonesia→China queries for the same product are cached independently
- Cache entries are stable and predictable

**Graceful degradation:** Both `getCachedMapping()` and `setCachedMapping()` check for the presence of Supabase env vars before initialising the client. If Supabase is not configured, all operations return `null` silently and the app falls back to direct OpenAI calls. This allows local development without a Supabase project.

**Non-blocking writes:** Cache writes and history logs are fire-and-forget (no `await`). This ensures the API response is not delayed by database write latency.

### 4.5 `app/api/map/route.ts` — API Endpoint

Request validation:
1. Checks `query`, `direction`, and `searchMode` are present
2. Enforces minimum query length (2 characters)
3. Returns HTTP 400 with descriptive error on validation failure

Cache-first pattern:
1. Attempt Supabase cache lookup
2. On hit: return cached result immediately with `cached: true` flag
3. On miss: call `mapTariffCodes()` → cache result → log history → return

Error differentiation:
- Missing API key → HTTP 503 with setup instructions
- General errors → HTTP 500 with error message

### 4.6 `components/SearchForm.tsx` — Search Interface

Three inputs as specified in the functional requirements:
1. **Direction toggle** — China→Indonesia or Indonesia→China (pill buttons)
2. **Search mode selector** — Description / HS Code / Local Code (tab-style buttons)
3. **Query text input** — Adapts placeholder and label based on mode

Example chips provide quick-access pre-filled queries per mode, enabling demo and testing without domain knowledge.

### 4.7 `components/ResultCard.tsx` — Results Display

Results are rendered as expandable cards. The collapsed view shows:
- Rank number
- National code (font-mono, bold)
- Tariff rate badge (when available)
- Product description
- Confidence badge + progress bar
- Explanation (truncated to 2 lines)

The expanded view reveals:
- Match basis (human-readable label)
- Tariff notes (when present)
- Divergence note (amber highlight to draw attention)
- Source reference

The expand/collapse pattern reduces visual noise when 5 results are displayed simultaneously.

### 4.8 `components/ConfidenceBadge.tsx` — Confidence Visualisation

The badge combines two elements:
1. A **colour-coded label** (green = exact, blue = likely, amber = partial, red = manual review)
2. A **progress bar** at the same percentage width as the confidence score

This provides both categorical and quantitative confidence information at a glance, consistent with the case study requirement to distinguish "high-confidence crosswalks" from "uncertain inferences."

---

## 5. Prompt Iteration History

| Version | Change | Problem Solved |
|---|---|---|
| v1.0 | Basic instruction: "map HS codes" | Baseline — unstructured output |
| v1.1 | Added JSON schema requirement | Structured output, but rates fabricated |
| v2.0 | Added "NEVER fabricate tariff rates" constraint | Rates flagged for verification |
| v2.1 | Added confidence rubric (4 tiers with numeric ranges) | Better calibrated scores |
| v3.0 | Added `match_basis` enum and divergenceNote field | Traceable logic layer added |
| v3.1 | Added "identify HS anchor first" instruction | Cleaner separation of 6-digit anchor vs national codes |
| v4.0 | Added AHTN 2022 context, source reference requirements, anti-binding-ruling disclaimer | Final production prompt |

---

## 6. Build Decisions

### D1: Next.js App Router over Pages Router
App Router enables React Server Components for the layout and metadata, and native `response.json()` in API routes without needing to import `NextResponse`. The App Router is the Next.js standard as of version 13+.

### D2: GPT-4o over Fine-Tuned Model
A fine-tuned model would require a high-quality bilateral HS code dataset (CCC ↔ BTKI crosswalk table) that is not publicly available. GPT-4o's training on public tariff documentation provides sufficient coverage for a prototype, and the JSON mode API eliminates the need for prompt few-shot examples.

### D3: Supabase over Redis for Caching
Supabase was selected because:
1. It provides both caching (via PostgreSQL JSONB) and durable search history in one free-tier service
2. It integrates with Vercel natively
3. The `search_history` table enables analytics and audit trail without a separate logging service

### D4: Tailwind CSS over CSS Modules
Tailwind was selected for rapid iteration speed. The design system is implemented entirely with Tailwind utilities, requiring no custom CSS beyond what Next.js generates automatically.

### D5: Client-side State over Server Components for Results
The search form and results panel use `"use client"` React components because:
1. The search triggers a `fetch()` POST request that requires client-side event handling
2. Result state must be maintained between searches without full page reloads
3. The loading skeleton and expand/collapse interactions require client-side state

---

## 7. Test Matrix

| Test Scenario | Input | Expected Behaviour | Verified |
|---|---|---|---|
| Basic description | "laptop computer" | 5 matches near 847130, confidence 70–95% | ✅ |
| Specific HS code | "847130" | 5 CCC or BTKI extensions of 847130 | ✅ |
| Local code China | "8471301000" | Maps to closest BTKI codes | ✅ |
| Local code Indonesia | "1511100000" (crude palm oil) | Maps to closest CCC codes | ✅ |
| Ambiguous description | "industrial pump" | Multi-chapter candidates, mixed confidence | ✅ |
| Vague description | "machine part" | Low confidence across multiple chapters | ✅ |
| One-to-many | "palm oil" (Indonesia→China) | Multiple CCC codes covering CPO grades | ✅ |
| Manual review trigger | "smart home hub" | ≥1 result with `manual_review` matchType | ✅ |
| Missing API key | No env var set | HTTP 503 with setup instructions | ✅ |
| Empty query | "" (submitted) | HTTP 400 before reaching AI | ✅ |
| Cache hit | Repeat identical query | Response includes `cached: true` | ✅ (when Supabase configured) |

---

## 8. Build Results

### Production Build Output

```
Route (app)
┌ ○ /                    (static, prerendered)
├ ○ /_not-found          (static)
└ ƒ /api/map             (dynamic, server-rendered on demand)

✓ Compiled successfully in 2.6s
✓ TypeScript: 0 errors
```

### TypeScript Check

```bash
$ npx tsc --noEmit
(no output — 0 errors)
```

---

## 9. Gate Criteria

| Criterion | Target | Result |
|---|---|---|
| All 3 search input types supported | description, hs_code, local_code | ✅ All implemented |
| Bidirectional mapping | China↔Indonesia both directions | ✅ Toggle in UI |
| Top 5 matches per query | 5 results | ✅ Enforced in prompt |
| Confidence score on each result | 0–100% | ✅ Rendered as badge + bar |
| Match type label | exact / likely / partial / manual_review | ✅ 4 tiers implemented |
| Explanation per result | Short explanation field | ✅ Shown on card |
| Tariff rate indicator | Rate or rate note | ✅ Rate badge on card |
| Source reference | Citable source string | ✅ In expandable detail |
| Traceable match logic | matchBasis field | ✅ 4 basis types |
| Manual review flagging | Flag when certainty < 40% | ✅ Warning banner shown |
| National code divergence handling | divergenceNote field | ✅ Amber warning in details |
| TypeScript: 0 errors | Clean compile | ✅ `tsc --noEmit` passes |
| Next.js build: passes | Successful production build | ✅ `npm run build` passes |

> **All MVP gate criteria met.** App is ready for Vercel deployment with valid `OPENAI_API_KEY`.

---

## 10. Deployment Commands

```bash
# Local development
cd tariff-mapper
cp .env.local.example .env.local
# Add OPENAI_API_KEY (required) and Supabase vars (optional) to .env.local
npm install
npm run dev
# Visit http://localhost:3000

# Supabase schema setup (run in Supabase SQL Editor)
# See BUILD_DOCUMENTATION.md §7 for full SQL

# Vercel deployment
npm i -g vercel
vercel deploy
# Set env vars in Vercel dashboard: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 11. Next Steps → Phase 02 (Enhanced Data Layer)

- Integrate live tariff rate APIs from China Customs and Bea Cukai portals
- Build bilingual HS code embedding index using `text-embedding-3-small` for higher-precision matching
- Add ASEAN AHTN 2022 crosswalk table as structured reference for 8-digit extensions
- Implement batch CSV mapping endpoint for bulk workflow
- Add HS chapter browser for discovery mode
- Implement per-user rate limiting before public launch
