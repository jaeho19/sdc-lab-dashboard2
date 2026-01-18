# SDC Lab Dashboard 성능 최적화 가이드

## 개요

이 문서는 SDC Lab Dashboard의 React/Next.js 성능 최적화 작업 내역과 향후 개선 방향을 정리합니다.

---

## 완료된 최적화 (2024-01)

### Phase 1: 코드 스플리팅 (높은 영향도)

#### 1-1. FullCalendar 동적 임포트
- **변경 파일**:
  - `src/components/features/dashboard/dashboard-calendar.tsx`
  - `src/components/features/dashboard/dashboard-calendar-inner.tsx` (신규)
  - `src/components/features/calendar/calendar-view.tsx`
  - `src/components/features/calendar/calendar-view-inner.tsx` (신규)
- **효과**: FullCalendar (~200KB)가 필요한 페이지에서만 로드
- **방법**: `next/dynamic`으로 SSR 비활성화 및 로딩 스피너 추가

```tsx
const DashboardCalendarInner = dynamic(
  () => import("./dashboard-calendar-inner").then((mod) => mod.DashboardCalendarInner),
  {
    ssr: false,
    loading: () => <Loader2 className="h-8 w-8 animate-spin" />,
  }
);
```

#### 1-2. KaTeX/Markdown 코드 스플리팅
- **변경 파일**:
  - `src/components/ui/markdown-renderer.tsx` (신규) - KaTeX 포함
  - `src/components/ui/markdown-simple.tsx` (신규) - KaTeX 미포함
  - `src/components/features/research/research-note-card.tsx`
  - `src/components/features/research/research-flowchart.tsx`
  - `src/app/(dashboard)/peer-review/page.tsx`
  - `src/app/(dashboard)/research-notes/page.tsx`
  - `src/components/features/members/member-research-notes.tsx`
- **효과**: KaTeX (~150KB)가 수학 렌더링이 필요한 컴포넌트에서만 로드
- **방법**: 두 가지 마크다운 렌더러 분리 (KaTeX 포함/미포함)

#### 1-3. 캐싱 전략 검토
- **결론**: Supabase 쿠키 기반 인증으로 인해 `force-dynamic` 유지
- **대안**: 클라이언트 측 캐싱 (SWR, React Query) 활용 권장

---

### Phase 2: 메모이제이션 (중간 영향도)

#### 2-1. timeline-calendar.tsx 최적화
- **적용 항목**:
  - `useMemo`: `dates`, `dateRange`, `selectedItems`, `weekdays`, `pendingGoals`
  - `useCallback`: `handleSelectDate`, `handlePrevWeek`, `handleNextWeek`, `getBarStyle`, `getGoalStartDate`
- **효과**: 불필요한 재계산 및 리렌더링 방지

#### 2-2. weekly-goals.tsx 최적화
- **적용 항목**:
  - `useMemo`: `monthInfo`, `sortedGoals`, `groupedGoals`
  - `useCallback`: `handleAddGoal`, `handleToggleGoal`, `handleDeleteGoal`, `handleOpenEditDialog`, `handleEditGoal`, `formatDeadline`
- **효과**: 목표 추가/수정/삭제 시 전체 리스트 리렌더링 방지

#### 2-3. React Query DevTools 프로덕션 제외
- **변경 파일**: `src/lib/react-query/provider.tsx`
- **효과**: 프로덕션 번들에서 DevTools 코드 제외

```tsx
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? require("@tanstack/react-query-devtools").ReactQueryDevtools
    : () => null;
```

---

### Phase 3: 번들 분석 도구 설정

#### 설치된 패키지
```bash
npm install --save-dev @next/bundle-analyzer cross-env
```

#### next.config.js 설정
```js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
```

#### 사용 방법
```bash
npm run analyze
```

브라우저에서 자동으로 3개의 분석 HTML 파일이 열림:
- `client.html` - 클라이언트 번들
- `nodejs.html` - 서버 번들
- `edge.html` - Edge 런타임 번들

---

### Phase 4: Sidebar 최적화 (2025-01)

#### 4-1. 컴포넌트 메모이제이션
- **변경 파일**: `src/components/layout/sidebar.tsx`
- **적용 항목**:
  - `memo()` 적용: `SidebarContent`, `NavItem`, `MemberSubItem`, `FavoriteSubItem`, `ExternalLinkItem`
  - `useCallback` 적용: `toggleMembersExpanded`, `toggleResearchExpanded`, `handleLogout`
- **효과**: 사이드바 내 개별 아이템 리렌더링 방지

```tsx
const NavItem = memo(function NavItem({ name, href, icon, isActive, isCollapsed, onLinkClick }) {
  // ...
});

const MemberSubItem = memo(function MemberSubItem({ member, isActive, onLinkClick }) {
  // ...
});
```

#### 4-2. 즐겨찾기 로딩 최적화
- **변경 내용**: `pathname` 의존성 제거
- **이전**: `useEffect(..., [pathname])` - 페이지 이동할 때마다 즐겨찾기 재로드
- **이후**: `useEffect(..., [])` - 최초 1회만 로드 (페이지 전환 시 Next.js 자연스럽게 리프레시)
- **효과**: 불필요한 API 호출 감소

#### 4-3. 서브메뉴 구조 개선
- **적용 내용**:
  - 멤버 목록을 `MemberSubItem` 컴포넌트로 분리
  - 즐겨찾기 프로젝트를 `FavoriteSubItem` 컴포넌트로 분리
  - 외부 링크를 `ExternalLinkItem` 컴포넌트로 분리
- **효과**: 개별 아이템만 리렌더링 (전체 사이드바 리렌더링 방지)

### Phase 5: 이미지 최적화 (2025-01)

#### 5-1. AvatarImage를 Next.js Image로 교체
- **변경 파일**: `src/components/ui/avatar.tsx`
- **적용 내용**:
  - 외부 URL 이미지에 `next/image` 적용
  - 자동 WebP 변환 및 최적화
  - 기본 lazy loading 적용
- **효과**: 이미지 로딩 속도 개선, 대역폭 절약

```tsx
const AvatarImage = React.forwardRef(({ src, priority = false, ...props }, ref) => {
  if (isExternalUrl) {
    return (
      <AvatarPrimitive.Image asChild ref={ref} {...props}>
        <Image
          src={src}
          fill
          sizes="40px"
          priority={priority}
          className="aspect-square h-full w-full object-cover"
        />
      </AvatarPrimitive.Image>
    );
  }
  // ...
});
```

#### 5-2. 주요 아바타에 priority 속성 적용
- **적용 위치**:
  - `src/components/layout/header.tsx` - 헤더 사용자 아바타
  - `src/components/layout/sidebar.tsx` - 사이드바 사용자 아바타
- **효과**: LCP(Largest Contentful Paint) 개선

### Phase 6: 폰트 최적화 (2025-01)

#### 6-1. next/font 최적화 설정
- **변경 파일**: `src/app/layout.tsx`
- **적용 내용**:
  - `display: "swap"` 추가 - 폰트 로드 중 시스템 폰트 표시
  - `preload: true` 추가 - 중요 폰트 사전 로드
- **효과**: FOIT(Flash of Invisible Text) 방지, CLS 개선

```tsx
const paperlogy = localFont({
  src: [...],
  variable: "--font-paperlogy",
  display: "swap",
  preload: true,
});
```

#### 6-2. 중복 @font-face 제거
- **변경 파일**: `src/app/globals.css`
- **변경 내용**:
  - CDN @font-face 선언 제거 (next/font/local이 자동 처리)
  - CSS 변수 기반 폰트 참조로 통일 (`var(--font-paperlogy)`)
- **효과**: 중복 폰트 로드 방지, 일관된 폰트 관리

### Phase 7: 추가 코드 스플리팅 분석 (2025-01)

#### 7-1. Radix UI 컴포넌트 분석
- **분석 대상**: Dialog, AlertDialog, Sheet 컴포넌트
- **사용 현황**:
  - Dialog: 10개 파일에서 사용
  - AlertDialog: 2개 파일에서 사용
  - Sheet: 1개 파일에서 사용
- **결론**: Radix UI 컴포넌트는 이미 개별 패키지로 분리되어 tree-shaking이 효과적으로 작동
- **조치**: 추가 동적 임포트 불필요

#### 7-2. 차트 라이브러리 분석
- **검색 대상**: mermaid, recharts, chart.js
- **결과**: 프로젝트에서 사용하지 않음
- **결론**: 차트 라이브러리 관련 코드 스플리팅 불필요

#### 7-3. 최적화 현황 요약
- FullCalendar (~200KB): ✅ 동적 임포트 완료 (Phase 1)
- KaTeX (~150KB): ✅ 코드 스플리팅 완료 (Phase 1)
- Radix UI: ✅ tree-shaking으로 자동 최적화
- 차트 라이브러리: N/A (미사용)

### Phase 8: Web Vitals 모니터링 (2025-01)

#### 8-1. web-vitals 라이브러리 설정
- **추가 파일**:
  - `src/lib/web-vitals.ts` - Web Vitals 수집 및 리포팅 유틸리티
  - `src/components/web-vitals-reporter.tsx` - 클라이언트 컴포넌트
- **변경 파일**: `src/app/layout.tsx` - WebVitalsReporter 추가
- **측정 지표**:
  - LCP (Largest Contentful Paint)
  - INP (Interaction to Next Paint) - FID 대체
  - CLS (Cumulative Layout Shift)
  - FCP (First Contentful Paint)
  - TTFB (Time to First Byte)

```tsx
// src/lib/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

export function initWebVitals() {
  const isDev = process.env.NODE_ENV === "development";

  const reportHandler = (metric: Metric) => {
    if (isDev) {
      logMetric(metric); // 콘솔 출력
    } else {
      sendToAnalytics(metric); // 분석 서비스 전송
    }
  };

  onLCP(reportHandler);
  onINP(reportHandler);
  onCLS(reportHandler);
  onFCP(reportHandler);
  onTTFB(reportHandler);
}
```

### Phase 9: 의존성 정리 (2025-01)

#### 9-1. 미사용 의존성 제거
- **제거된 패키지**:
  - `@hookform/resolvers` - react-hook-form은 사용 중이나 resolvers는 미사용
  - `resend` - 이메일 전송 라이브러리, 현재 미사용

#### 9-2. 폰트 서브셋 스크립트 준비
- **추가 파일**: `scripts/subset-fonts.cjs`
- **추가 스크립트**: `npm run fonts:subset`
- **목적**: Paperlogy TTF 폰트를 woff2 서브셋으로 변환
- **예상 효과**: ~2.6MB → ~500KB (80% 감소)

**방법 1: npm 스크립트 사용**
```bash
# subset-font 패키지 설치 후 실행
npm install subset-font
npm run fonts:subset
```

**방법 2: 온라인 도구 사용 (권장)**
1. [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)
2. [Transfonter](https://transfonter.org/)

**설정**:
- Format: WOFF2
- Subsetting: Korean (한글 자주 사용 글자만)
- 생성된 파일을 `public/fonts/`에 저장

**woff2 파일 적용 후 layout.tsx 수정**:
```tsx
const paperlogy = localFont({
  src: [
    { path: "../../public/fonts/Paperlogy-4Regular.woff2", weight: "400" },
    { path: "../../public/fonts/Paperlogy-6SemiBold.woff2", weight: "600" },
    { path: "../../public/fonts/Paperlogy-7Bold.woff2", weight: "700" },
    { path: "../../public/fonts/Paperlogy-8ExtraBold.woff2", weight: "800" },
  ],
  variable: "--font-paperlogy",
  display: "swap",
  preload: true,
});
```

---

## 향후 개선 과제

### 우선순위 중간

#### 폰트 서브셋 실행 (수동 작업 필요)
- [ ] 온라인 도구로 woff2 서브셋 생성 (Phase 9-2 참조)
- [ ] `public/fonts/`에 woff2 파일 저장
- [ ] `layout.tsx`에서 TTF → woff2 경로 변경

#### 추가 코드 스플리팅
- [x] Radix UI Dialog/Select 등 모달 컴포넌트 분석 → tree-shaking으로 이미 최적화됨
- [x] 차트 라이브러리 분석 → 프로젝트에서 미사용

### 우선순위 낮음

#### Web Vitals 모니터링
- [x] `web-vitals` 라이브러리 추가 (Phase 8에서 완료)
- [x] LCP, INP, CLS, FCP, TTFB 지표 추적

#### 기타
- [x] 사용하지 않는 의존성 정리 (Phase 9에서 완료)
- [x] tree-shaking 최적화 확인 (Phase 7에서 검증)

---

## 성능 측정 기준

### Core Web Vitals 목표
| 지표 | 목표 | 설명 |
|------|------|------|
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |

### 번들 크기 목표
| 항목 | 목표 |
|------|------|
| First Load JS | < 100KB |
| 페이지별 JS | < 50KB |

---

## 참고 자료

- [Vercel React Best Practices](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Optimization Patterns](https://react.dev/reference/react/useMemo)

---

## 변경 이력

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2025-01 | Phase 9: 의존성 정리 (@hookform/resolvers, resend 제거) | Claude |
| 2025-01 | Phase 8: Web Vitals 모니터링 (web-vitals 추가) | Claude |
| 2025-01 | Phase 7: 추가 코드 스플리팅 분석 (Radix UI, 차트 라이브러리) | Claude |
| 2025-01 | Phase 6: 폰트 최적화 (font-display: swap, preload, 중복 제거) | Claude |
| 2025-01 | Phase 5: 이미지 최적화 (Next.js Image, priority 적용) | Claude |
| 2025-01 | Phase 4: Sidebar 최적화 (메모이제이션, 즐겨찾기 로딩 최적화) | Claude |
| 2024-01 | Phase 1-3 완료, 번들 분석기 설정 | Claude |
