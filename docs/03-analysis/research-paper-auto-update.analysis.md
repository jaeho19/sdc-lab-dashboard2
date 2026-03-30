# Gap Analysis: research-paper-auto-update

> Design vs Implementation comparison (Re-analysis after gap fixes)

**Design Document**: `docs/02-design/features/research-paper-auto-update.design.md`
**Analysis Date**: 2026-03-30 (re-analysis, previous: 2026-03-29 at 93%)

---

## Overall Match Rate: 97%

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] ✅ 97%
```

---

## Section Breakdown

| Section | Previous | Current | Status |
|---------|:--------:|:-------:|:------:|
| DB Schema (4 tables + RLS + seed) | 97% | 97% | PASS |
| API Clients (5 lib files) | 95% | 95% | PASS |
| API Routes (fetch + list) | 90% | 90% | PASS |
| Frontend: Research Map | 95% | 95% | PASS |
| Admin UI (settings/papers) | 85% | 97% | PASS (improved) |
| Scheduling (GitHub Actions) | 100% | 100% | PASS |
| Environment Variables | 80% | 100% | PASS (fixed) |
| Types (database.types.ts) | 100% | 100% | PASS |

---

## Section Details

### 1. DB Schema — 97%

All 4 tables match design: `research_fields`, `papers`, `paper_field_links`, `paper_fetch_logs`. Columns, types, RLS policies, indexes, and 12 seed records all present.

**Deviations (acceptable)**:
- Trigger function name: design says `update_updated_at()`, implementation uses `update_updated_at_column()` (matches existing codebase)
- Added `service_role` policy on `paper_fetch_logs` (necessary for cron route)

### 2. API Clients — 95%

5 files in `src/lib/papers/` all present and functional:
- `types.ts` — all types match design
- `semantic-scholar.ts` — S2 client with normalization
- `openalex.ts` — OA client with inverted index restoration
- `normalize.ts` — dedup, truncateTitle, buildPaperDetailHtml, escapeHtml
- `member-matcher.ts` — 3-strategy matching (name_en, initials, Korean)

**Minor gap**: `referenceCount` omitted from S2 FIELDS (unused field)

### 3. API Routes — 90%

- `POST /api/papers/fetch` — fully implemented (CRON_SECRET, search, upsert, logging)
- `GET /api/papers` + `PATCH /api/papers` — list with filters + admin toggle

**Gap**: Design specified `/api/papers/map-nodes` route (Section 4-3) — not implemented. Functionality provided via direct Supabase query in `usePapers` hook instead. Acceptable architecture simplification.

### 4. Frontend: Research Map — 95%

- `research-map-data.ts`: "paper" NodeType, color (#f5a623), label added
- `use-papers.ts`: React Query hook with Supabase join, paperToMapNode/Links
- `research-map-graph.tsx`: All integrations present:
  - usePapers hook called
  - Paper node merge into D3 data
  - Paper toggle button (default OFF)
  - Force sim: paper charge -150, link distance 50
  - Visual: semi-transparent fill, dashed stroke
  - NODE_TYPE_BADGES and LEGEND_ITEMS include "paper"

### 5. Admin UI — 97% (was 85%)

**Fixed gaps:**

| Gap | Resolution |
|-----|------------|
| Search query editing UI (was read-only) | `SearchQueryEditor` dialog with API selector, multi-query add/remove, Textarea editing, save mutation |
| Field-based filter dropdown (missing) | `<Select>` dropdown with `research_fields` data, combined with title search |
| Lab member manual toggle (missing) | `toggleLabMember` mutation with `UserCheck`/`UserX` icons |

**Remaining minor gap**: Tab components inlined in single file (790 lines) vs design's separate files. Functional equivalent, structural deviation only.

### 6. Scheduling — 100%

`.github/workflows/fetch-papers.yml` — weekly Monday 03:00 UTC + manual dispatch + HTTP status check + 10-min timeout

### 7. Environment Variables — 100% (was 80%)

`.env.local.example` now contains:
- `SEMANTIC_SCHOLAR_API_KEY` — with description and API key docs link
- `OPENALEX_MAILTO` — with description and polite pool docs link

### 8. Types — 100%

All designed types present in `src/lib/papers/types.ts`.

---

## Remaining Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | `/api/papers/map-nodes` route not created | LOW | Skip (hook approach works) |
| 2 | Tab components inlined in single file (790 lines) | LOW | Refactor later |
| 3 | `referenceCount` omitted from S2 FIELDS | NONE | Skip (unused) |

## Added Beyond Design

| # | Addition | Reason |
|---|----------|--------|
| 1 | service_role RLS on paper_fetch_logs | Required for cron route |
| 2 | pg_trgm extension creation | Explicit dependency |
| 3 | Title search in papers API | UX improvement |
| 4 | GitHub Actions timeout (10min) | Safety |
| 5 | HTTP status error handling in cron | Reliability |
| 6 | escapeHtml in normalize.ts | XSS prevention |
| 7 | SearchQueryEditor with multi-query support | Richer than design mockup |

---

## Verdict

**Match Rate: 97%** (up from 93%) — All previously identified functional gaps resolved. Only cosmetic file structure and unused API route remain. Feature is production-ready.

**Recommendation**: Proceed to `/pdca report research-paper-auto-update`

---

*Feature: research-paper-auto-update*
*Status: Check (97%)*
