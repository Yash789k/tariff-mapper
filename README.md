# TariffMapper — China ↔ Indonesia Customs Classification

> AI-powered tariff code mapping between China (CCC) and Indonesia (BTKI/AHTN).  
> Built for Tsunami Advisors AI Intern Case Study · May 2026

---

## What It Does

TariffMapper helps trade professionals map import and export product classification codes between China and Indonesia. Enter a product description, HS code, or national tariff code and receive the top 5 most likely classification matches in the target country — each with a confidence score, match type label, tariff rate indicator, explanation, and source citation.

**Supports:**
- Search by product description, HS code (6-digit), China CCC code, or Indonesia BTKI code
- Bidirectional mapping: China → Indonesia and Indonesia → China
- One-to-many mappings, ambiguous descriptions, national code divergence flagging
- Automatic "manual review required" flag when confidence is too low

---

## Quick Start

```bash
cd tariff-mapper
cp .env.local.example .env.local
# Add your OPENAI_API_KEY to .env.local

npm install
npm run dev
# Open http://localhost:3000
```

---

## Required API Keys

| Key | Where to Get | Required? |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — needs Tier 1+ for GPT-4o | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Settings → API | Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same location as above | Optional |

**Estimated OpenAI cost:** ~$0.01–0.03 per search query (GPT-4o, ~1500–2500 tokens per request).

**Supabase is optional** — the app works fully without it. When configured, it adds search result caching (reduces repeat query costs) and search history logging.

---

## Deploy to Vercel

```bash
npm i -g vercel
cd tariff-mapper
vercel deploy
```

Set these environment variables in the Vercel project dashboard after deploying:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` (optional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional)

---

## Supabase Setup (Optional)

Run this SQL in your Supabase project's SQL Editor:

```sql
CREATE TABLE mappings_cache (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key   TEXT UNIQUE NOT NULL,
  result      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE search_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query       TEXT NOT NULL,
  direction   TEXT NOT NULL,
  search_mode TEXT NOT NULL,
  hs_anchor   TEXT,
  result_count INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Project Structure

```
tariff-mapper/
├── app/
│   ├── page.tsx              # Main UI (search form + results)
│   └── api/map/route.ts      # POST /api/map — mapping endpoint
├── components/
│   ├── Header.tsx
│   ├── SearchForm.tsx
│   ├── ResultCard.tsx
│   └── ConfidenceBadge.tsx
└── lib/
    ├── types.ts              # TypeScript contracts
    ├── prompt.ts             # GPT-4o system + user prompts
    ├── openai.ts             # AI mapping logic
    └── supabase.ts           # Caching + history

docs/
├── BUILD_DOCUMENTATION.md   # Full technical build docs (4 pages)
├── MVP_TASKLIST.md          # Phase-by-phase task list
└── PHASE_01_LOG.md          # Engineering build log
```

---

## Documentation

- [`docs/BUILD_DOCUMENTATION.md`](docs/BUILD_DOCUMENTATION.md) — Tools, prompts, architecture, data sources, matching logic, limitations
- [`docs/MVP_TASKLIST.md`](docs/MVP_TASKLIST.md) — Full task breakdown by phase
- [`docs/PHASE_01_LOG.md`](docs/PHASE_01_LOG.md) — Detailed engineering build log

---

## Disclaimer

This tool is for research and informational purposes only. It does not constitute a binding tariff ruling or legal customs advice. Always verify classifications with official customs authorities before importation or exportation.

**Data sources:** WCO HS 2022 · China CCC 2024 · Indonesia BTKI 2022 · ASEAN AHTN 2022
