# Plan: mobile-performance-optimization

## Feature Name
모바일 앱 반응속도 개선 (2차 심화 최적화)

## Description
모바일 환경에서 앱을 열 때 체감되는 로딩 지연을 해소하기 위한 심화 성능 최적화.
1차 최적화(page-loading-optimization, 94% 달성)에서 다루지 않은 핵심 병목을 추가로 해결한다.

## Problem Statement

### 사용자 체감 문제
- 모바일에서 앱을 열 때 화면이 늦게 뜸
- 페이지 전환 시 빈 화면(blank screen)이 잠깐 보임
- 사이드바 접힘 애니메이션이 모바일에서 버벅임

### 근본 원인 분석

| # | 원인 | 영향도 | 세부 내용 |
|---|------|:------:|----------|
| 1 | **loading.tsx 부재** | Critical | 프로젝트 전체에 loading.tsx가 0개. 페이지 전환 시 서버 렌더링 완료까지 빈 화면 노출 |
| 2 | **폰트 파일 637KB 전량 preload** | Critical | Paperlogy 4개 웨이트(각 ~160KB) 모두 preload. 모바일 3G/4G에서 첫 렌더 차단 |
| 3 | **Layout 워터폴 쿼리** | High | 매 페이지 진입마다 3개 순차 Supabase 호출 (getUser → members select("*") → notificationCount). getUser 2회 중복 호출 |
| 4 | **FullTimeMembersGantt 정적 import** | High | 무거운 클라이언트 컴포넌트가 members 페이지에 동기 로딩 |
| 5 | **캘린더 이벤트 무제한 조회** | Medium | calendar, dashboard 모두 전체 이벤트 조회. 데이터 누적 시 payload 무한 증가 |
| 6 | **KaTeX CSS 무조건 번들** | Medium | enableMath 미사용 시에도 ~280KB의 KaTeX CSS가 클라이언트 번들에 포함 |
| 7 | **transition-all on layout** | Low | CSS `transition-all` → 모바일 GPU에서 불필요한 프로퍼티까지 감시, 사이드바 전환 시 프레임 드롭 |
| 8 | **optimizePackageImports 미설정** | Low | lucide-react 등 대형 아이콘 라이브러리 트리쉐이킹 최적화 미적용 |

## Solution Overview

### P0 - Critical (체감 즉시 개선)

#### 1. loading.tsx 스켈레톤 추가
- **대상**: dashboard, members, calendar, research (4개 페이지)
- **구현**: 각 페이지의 실제 레이아웃에 맞는 Skeleton UI
- **효과**: 서버 렌더링 중 빈 화면 대신 스켈레톤 표시 → 체감 로딩 시간 대폭 감소

#### 2. 폰트 preload 최적화
- **현재**: 4개 웨이트 모두 `preload: true` (637KB)
- **변경**: Regular(400) + Bold(700)만 preload, SemiBold(600)/ExtraBold(800)는 `preload: false`
- **추가**: ExtraBold(800)가 실제 사용되는 곳 확인 후 불필요 시 제거
- **효과**: preload 대상 ~320KB로 50% 감소

#### 3. Layout 쿼리 병렬화 + select 최적화
- **현재**: getUser() → members select("*") → notificationCount (순차, getUser 2회)
- **변경**:
  ```
  const user = await getUser()
  const [member, notifCount] = await Promise.all([
    supabase.from("members").select("name, avatar_url, role, status").eq("id", user.id).single(),
    getUnreadNotificationCount(user)  // user 전달로 중복 getUser 제거
  ])
  ```
- **효과**: Layout 렌더링 시간 ~40% 단축 (2 RTT → 1 RTT 병렬)

### P1 - High Impact

#### 4. FullTimeMembersGantt 동적 import
- **현재**: `import { FullTimeMembersGantt } from "..."` (정적)
- **변경**: `const FullTimeMembersGantt = dynamic(() => import("..."), { ssr: false, loading: () => <GanttSkeleton /> })`
- **효과**: Members 페이지 초기 JS 번들 감소, 간트차트 로딩 전 스켈레톤 표시

#### 5. 캘린더 이벤트 날짜 범위 제한
- **현재**: 전체 이벤트 조회 (무제한)
- **변경**: 현재 기준 3개월 전 ~ 12개월 후 범위 필터 추가
- **대상**: `calendar/page.tsx`, `dashboard/page.tsx`
- **효과**: payload 크기 고정, 쿼리 속도 일관성 확보

### P2 - Medium Impact

#### 6. transition-all 최적화
- **현재**: `transition-all duration-300`
- **변경**: `transition-[margin-left] duration-300`
- **효과**: 모바일 사이드바 전환 시 프레임 드롭 해소

#### 7. optimizePackageImports 설정
- **next.config.js**에 추가:
  ```js
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
  ```
- **효과**: 아이콘 라이브러리 번들 사이즈 최소화

#### 8. getUnreadNotificationCount 최적화
- 내부에서 `getUser()` 중복 호출 제거
- 외부에서 받은 user 객체를 재사용하도록 시그니처 변경

## Affected Files

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/(dashboard)/dashboard/loading.tsx` | **신규** - 대시보드 스켈레톤 |
| `src/app/(dashboard)/members/loading.tsx` | **신규** - 멤버 페이지 스켈레톤 |
| `src/app/(dashboard)/calendar/loading.tsx` | **신규** - 캘린더 스켈레톤 |
| `src/app/(dashboard)/research/loading.tsx` | **신규** - 연구 페이지 스켈레톤 |
| `src/app/layout.tsx` | 폰트 preload 최적화 |
| `src/app/(dashboard)/layout.tsx` | 쿼리 병렬화 + select 필드 지정 |
| `src/app/(dashboard)/members/page.tsx` | Gantt dynamic import |
| `src/app/(dashboard)/calendar/page.tsx` | 이벤트 날짜 범위 필터 |
| `src/app/(dashboard)/dashboard/page.tsx` | 이벤트 날짜 범위 필터 |
| `next.config.js` | optimizePackageImports |
| `src/lib/actions/notifications.ts` | getUser 중복 제거 |

## Out of Scope (이번에 다루지 않는 항목)
- KaTeX CSS 조건부 로딩 (MarkdownRenderer 구조 변경 필요, 별도 피처로)
- 아바타 이미지 Next.js Image 컴포넌트 전환 (Radix Avatar 교체 필요)
- error.tsx 추가 (에러 처리는 별도 피처로)

## Success Criteria
- [ ] 모바일에서 페이지 전환 시 빈 화면 대신 스켈레톤 표시
- [ ] Layout 렌더 시 Supabase RTT 1회 병렬로 단축
- [ ] 폰트 preload 데이터 50% 감소 (~637KB → ~320KB)
- [ ] Members 페이지 초기 JS 번들 Gantt 분리
- [ ] 캘린더 이벤트 쿼리에 날짜 범위 제한 적용

## Dependencies
- 1차 최적화(page-loading-optimization) 완료 상태 기반

## Created
2026-02-25
