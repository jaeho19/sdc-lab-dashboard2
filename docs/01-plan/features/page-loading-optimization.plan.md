# Plan: page-loading-optimization

## Feature Name
페이지 로딩 속도 최적화

## Description
대시보드 페이지 전반의 로딩 속도를 개선하기 위한 종합적 성능 최적화

## Problem Statement
- 페이지 네비게이션 시 로딩 지연 체감
- 매 페이지 전환 시 layout에서 불필요한 Supabase 쿼리 반복
- React Query staleTime이 60초로 너무 짧아 불필요한 re-fetch 발생
- 대시보드 페이지에서 4~5개의 순차적 Supabase 쿼리 실행
- Research 페이지가 `force-dynamic`으로 설정되어 캐싱 미활용
- Next.js Image 최적화 미사용 (raw `<img>` 태그 사용)

## Solution Overview

### P0 - 즉시 개선 (High Impact, Low Effort)
1. **React Query staleTime 증가**: 60초 → 5분
2. **Dashboard 쿼리 병렬화**: Promise.all로 순차 쿼리를 병렬 실행
3. **Research 페이지 ISR 적용**: force-dynamic → revalidate=60
4. **Next.js Image 최적화 설정**: next.config.js에 formats/sizes 추가

### P1 - 단기 개선 (Medium Impact)
5. **Members/Research 페이지 ISR 적용**: 캐싱으로 TTFB 감소
6. **Supabase 쿼리 필드 최적화**: select("*") → 필요한 필드만 선택

### P2 - 중기 개선 (Long-term)
7. **FullCalendar 동적 import**: CalendarView, DashboardCalendar를 dynamic import (이미 구현됨)
   - Note: Gantt Chart는 커스텀 CSS 기반이라 dynamic import 불필요
8. **Font 서브셋**: woff2 포맷 + display:swap + preload (이미 구현됨)

## Affected Files
- `src/lib/react-query/provider.tsx` - staleTime 조정
- `src/app/(dashboard)/dashboard/page.tsx` - 쿼리 병렬화
- `src/app/(dashboard)/research/page.tsx` - ISR 적용
- `src/app/(dashboard)/members/page.tsx` - ISR 적용
- `src/app/(dashboard)/calendar/page.tsx` - ISR 적용
- `next.config.js` - 이미지 최적화 설정

## Success Criteria
- 페이지 전환 시 체감 로딩 시간 감소
- Dashboard 쿼리 시간 ~50% 단축 (병렬화)
- 반복 방문 시 캐시 활용으로 즉시 응답

## Created
2026-02-25
