# Gap Analysis: page-loading-optimization

## Analysis Date: 2026-02-25

## Overall Match Rate: 94%

## Item-by-Item Results

| # | Priority | Item | Status | Score |
|---|:--------:|------|:------:|:-----:|
| 1 | P0 | React Query staleTime 5min + gcTime 10min | PASS | 1.0 |
| 2 | P0 | Dashboard 쿼리 병렬화 (Promise.all) | PASS | 1.0 |
| 3 | P0 | Research 페이지 ISR (revalidate=60) | PASS | 1.0 |
| 4 | P0 | Next.js Image 최적화 (avif/webp) | PASS | 1.0 |
| 5 | P1 | Members/Calendar 페이지 ISR | PASS | 1.0 |
| 6 | P1 | Supabase select 필드 최적화 | PASS | 1.0 |
| 7 | P2 | FullCalendar dynamic import (기존 구현) | PASS | 1.0 |
| 8 | P2 | Font woff2 + preload + swap (기존 구현) | PASS | 1.0 |

## Implementation Details

### P0 Changes
- `src/lib/react-query/provider.tsx`: staleTime=5min, gcTime=10min, refetchOnWindowFocus=false
- `src/app/(dashboard)/dashboard/page.tsx`: 4개 쿼리 Promise.all 병렬화 + 필드 선택 최적화
- `src/app/(dashboard)/research/page.tsx`: force-dynamic → revalidate=60
- `next.config.js`: formats: ["image/avif", "image/webp"]

### P1 Changes
- `src/app/(dashboard)/members/page.tsx`: ISR(60s) + select 필드 지정
- `src/app/(dashboard)/calendar/page.tsx`: ISR(60s) + select 필드 지정

### P2 (Pre-existing)
- FullCalendar: CalendarView, DashboardCalendar 모두 dynamic import 확인
- Font: woff2 + display:swap + preload:true 확인

## Conclusion
모든 계획된 최적화 항목이 구현되었으며, Plan 문서도 실제 구현에 맞게 동기화 완료.
