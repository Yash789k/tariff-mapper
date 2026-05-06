# TariffMapper — MVP Task List

**Project:** China–Indonesia Tariff Code Mapping Web App  
**Client:** Tsunami Advisors  
**Sprint:** 1 Week  
**Status:** ✅ MVP Complete

---

## Phase 00 — Setup & Scaffold

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Read and parse case study PDF requirements | ✅ Done | Core Task, Functional Requirements, Deliverables extracted |
| 0.2 | Define tech stack (Next.js + GPT-4o + Supabase) | ✅ Done | Chosen for AI-first workflow and zero-infra serverless deployment |
| 0.3 | Scaffold Next.js 16 project with TypeScript + Tailwind | ✅ Done | `create-next-app` with App Router |
| 0.4 | Install dependencies: `openai`, `@supabase/supabase-js` | ✅ Done | All production deps installed |
| 0.5 | Create `.env.local.example` with required keys | ✅ Done | OPENAI_API_KEY, Supabase URL + anon key |

---

## Phase 01 — Core Type System & Data Contracts

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Define `TariffMatch` interface | ✅ Done | `code`, `confidence`, `matchType`, `matchBasis`, `divergenceNote`, etc. |
| 1.2 | Define `MappingRequest` and `MappingResponse` interfaces | ✅ Done | Used across API route and client |
| 1.3 | Define `MatchType` enum: `exact`, `likely`, `partial`, `manual_review` | ✅ Done | Aligns with case study requirements |
| 1.4 | Define `SearchMode` enum: `description`, `hs_code`, `local_code` | ✅ Done | All 3 search input types from spec |
| 1.5 | Define `MappingDirection` enum: `china_to_indonesia`, `indonesia_to_china` | ✅ Done | Bidirectional per spec requirement |
| 1.6 | Define `SearchHistoryEntry` interface for Supabase logging | ✅ Done | Audit trail for all searches |

---

## Phase 02 — AI Mapping Engine

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Design system prompt with HS/CCC/BTKI domain expertise | ✅ Done | Encodes confidence rubric, output contract, anti-hallucination constraints |
| 2.2 | Iterate system prompt (v1–v4) to fix fabrication and calibration | ✅ Done | See Build Documentation §4.2 |
| 2.3 | Set `response_format: json_object` and `temperature: 0.1` | ✅ Done | Ensures consistent, parseable output |
| 2.4 | Implement `buildUserPrompt()` parameterised by direction and mode | ✅ Done | Adapts prompt based on search context |
| 2.5 | Implement lazy `getClient()` to avoid build-time key errors | ✅ Done | Prevents Next.js static generation failures |
| 2.6 | Implement `mapTariffCodes()` function with full error handling | ✅ Done | Throws descriptive errors for missing API key |
| 2.7 | Test: product description → top 5 matches with confidence | ✅ Done | Manual test: "laptop", "palm oil", "cotton fabric" |
| 2.8 | Test: HS code input (e.g., `847130`) | ✅ Done | Returns CCC or BTKI extensions correctly |
| 2.9 | Test: local code input (e.g., `8471301000`) | ✅ Done | Handles 8–10 digit national codes |
| 2.10 | Test: ambiguous description (e.g., "industrial pump") | ✅ Done | Returns multi-chapter candidates with low confidence |
| 2.11 | Test: one-to-many mapping (e.g., "palm oil" → multiple CPO grades) | ✅ Done | Returns 5 distinct BTKI codes |
| 2.12 | Test: `manual_review` trigger (e.g., "smart home hub") | ✅ Done | Multi-chapter, AI flags correctly |

---

## Phase 03 — API Layer

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Implement `POST /api/map` route | ✅ Done | Next.js App Router API route |
| 3.2 | Add request validation (required fields, min length) | ✅ Done | Returns 400 on missing/invalid input |
| 3.3 | Integrate Supabase cache check (cache-first pattern) | ✅ Done | Skips OpenAI call if result already cached |
| 3.4 | Write result to Supabase cache after successful mapping | ✅ Done | Fire-and-forget, non-blocking |
| 3.5 | Log search to `search_history` table | ✅ Done | Query, direction, mode, HS anchor, count |
| 3.6 | Return descriptive error for missing `OPENAI_API_KEY` | ✅ Done | HTTP 503 with setup instructions |
| 3.7 | TypeScript compile: `0 errors` | ✅ Done | `npx tsc --noEmit` passes clean |
| 3.8 | Next.js production build: passes | ✅ Done | `npm run build` succeeds |

---

## Phase 04 — Frontend UI

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Build `Header` component with branding and badge | ✅ Done | HS 2022, CCC 2024, BTKI 2022 labels |
| 4.2 | Build `SearchForm` with direction toggle (CN↔ID) | ✅ Done | Toggle for both mapping directions |
| 4.3 | Build `SearchForm` with search mode selector (3 modes) | ✅ Done | Description / HS Code / Local Code |
| 4.4 | Add example chips to `SearchForm` for quick testing | ✅ Done | Pre-filled examples per search mode |
| 4.5 | Build `ConfidenceBadge` with tiered colour coding | ✅ Done | Green/blue/amber/red for match tiers |
| 4.6 | Build `ResultCard` with rank, code, description, confidence | ✅ Done | Expandable detail rows |
| 4.7 | Add expandable detail rows: match basis, tariff notes, divergence, source | ✅ Done | Collapsed by default for clean UI |
| 4.8 | Build results loading skeleton animation | ✅ Done | Animated pulse placeholders |
| 4.9 | Build error state with descriptive message | ✅ Done | Handles API errors gracefully |
| 4.10 | Build empty state with call-to-action | ✅ Done | Shows on first load, before search |
| 4.11 | Build HS anchor summary header above results | ✅ Done | Shows anchor code, description, processing note |
| 4.12 | Add `manual_review` warning banner when applicable | ✅ Done | Red count badge + advisory text |
| 4.13 | Add "How It Works" section on empty state | ✅ Done | 3-step illustrated explainer |
| 4.14 | Add legal disclaimer banner | ✅ Done | Amber warning; non-binding notice |
| 4.15 | Responsive layout: mobile + desktop | ✅ Done | Tailwind grid, stacks on mobile |
| 4.16 | Footer with data source attribution | ✅ Done | HS 2022, CCC 2024, BTKI 2022 |

---

## Phase 05 — Data & Infrastructure

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Design Supabase schema (`mappings_cache`, `search_history`) | ✅ Done | See Build Documentation §7 |
| 5.2 | Implement `getCachedMapping()` with cache_key lookup | ✅ Done | Normalised lowercase key |
| 5.3 | Implement `setCachedMapping()` with upsert | ✅ Done | Deduplicates on cache_key |
| 5.4 | Implement `logSearchHistory()` for audit trail | ✅ Done | Non-blocking, fire-and-forget |
| 5.5 | Graceful degradation when Supabase env vars are absent | ✅ Done | App works fully without Supabase (no caching) |
| 5.6 | Write SQL schema for manual Supabase setup | ✅ Done | Documented in BUILD_DOCUMENTATION.md |

---

## Phase 06 — Documentation & Delivery

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Write `BUILD_DOCUMENTATION.md` (2–4 pages) | ✅ Done | Tools, prompts, architecture, data sources, logic, limitations |
| 6.2 | Write `MVP_TASKLIST.md` (this file) | ✅ Done | Full task breakdown by phase |
| 6.3 | Write `PHASE_01_LOG.md` — build log | ✅ Done | Detailed engineering log per spec |
| 6.4 | Write `README.md` — top-level project README | ✅ Done | Quick start, deployment, API keys |
| 6.5 | Video demo bullet points | ✅ Done | 3–5 minute script outline |

---

## Post-MVP Backlog

| # | Task | Priority | Notes |
|---|---|---|---|
| B.1 | Live tariff rate API integration (China Customs / Bea Cukai portals) | High | Replace "verify with official schedule" with live rates |
| B.2 | Fine-tuned bilateral HS crosswalk model (vector embeddings) | High | Higher precision than general LLM for code-level matching |
| B.3 | Bulk CSV upload for batch mapping | Medium | Accept list of codes, return mapping CSV |
| B.4 | HS code chapter browser / tree navigation | Medium | Complementary to search; discovery mode |
| B.5 | Admin analytics dashboard (Supabase data) | Medium | Most-searched codes, confidence distributions, error rates |
| B.6 | Multi-language support (Bahasa Indonesia, Chinese 中文) | Medium | Key for end-user adoption |
| B.7 | Save / export results as PDF or CSV | Low | User convenience feature |
| B.8 | Rate limiting and API key management (per-user) | Low | Required before public launch |
| B.9 | ASEAN AHTN 8-digit crosswalk table integration | High | Structured reference for 8-digit AHTN codes |
| B.10 | Chapter 98 special provisions handler | High | Country-specific provisions need dedicated logic |
