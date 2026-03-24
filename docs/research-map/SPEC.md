# Research Map 통합 스펙

## 목표

SDC Lab 대시보드에 `/research-map` 페이지를 추가한다.
D3.js force-directed graph로 학생, 키워드, 프로젝트, 학회 간 연결 관계를 인터랙티브하게 시각화한다.

## 프로젝트 기술 스택 (기존)

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (인증 + DB), shadcn/ui (Radix 기반)
- 사이드바 네비게이션 (`src/components/layout/sidebar.tsx`)
- 다크/라이트 테마 지원 (`ThemeToggle`)
- 배포: Netlify

## 파일 구조

```
src/app/(dashboard)/research-map/
  └── page.tsx                    ← 서버 컴포넌트 (페이지 셸)

src/components/features/research-map/
  ├── research-map-graph.tsx      ← "use client" D3.js 그래프 (메인)
  ├── research-map-detail.tsx     ← 우측 상세 패널
  ├── research-map-controls.tsx   ← 좌측 뷰 모드 + 레전드
  └── research-map-data.ts        ← ★ 데이터 파일 (업데이트 대상)
```

## 데이터 파일

**`docs/research-map/research-map-data.ts`** 에 완성된 데이터가 있다.
이 파일을 `src/components/features/research-map/research-map-data.ts`로 복사하여 사용한다.

### 데이터 구조

- `NODES`: 노드 배열 (학생, 키워드, 프로젝트, 학회, 연구축)
- `LINKS`: 연결 배열 (source→target, type: link/collab/kk)
- `NODE_COLORS`: 타입별 색상 맵
- `NODE_LABELS`: 타입별 한국어 라벨

### 향후 업데이트 방법

연구가 발전하면 `research-map-data.ts`만 수정:
- 학생 추가: NODES에 `type: "student"` 항목 추가
- 키워드 추가: NODES에 `type: "theme"|"method"|"tech"` 추가
- 연결 추가: LINKS에 `{ source, target, type }` 추가
- 학회 업데이트: 기존 학회 노드의 desc/body/actions 수정

## 사이드바 추가

`src/components/layout/sidebar.tsx` 의 `navigation` 배열에 추가:

```tsx
import { Network } from "lucide-react";  // 아이콘

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Research", href: "/research", icon: BookOpen },
  { name: "Research Map", href: "/research-map", icon: Network },  // ← 추가
  { name: "Calendar", href: "/calendar", icon: Calendar },
  // ...
];
```

## 페이지 구현 상세

### page.tsx (서버 컴포넌트)

```tsx
import { ResearchMapGraph } from "@/components/features/research-map/research-map-graph";

export default function ResearchMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Research Map</h1>
        <p className="text-sm text-muted-foreground">
          연구 키워드 네트워크 — 학생, 방법론, 학회 간 연결을 탐색하세요
        </p>
      </div>
      <ResearchMapGraph />
    </div>
  );
}
```

### research-map-graph.tsx ("use client")

D3.js force-directed graph를 React 컴포넌트로 구현한다.

**핵심 요구사항:**
1. `useRef`로 SVG 참조, `useEffect`에서 D3 초기화
2. 대시보드의 다크/라이트 테마를 `useTheme()`으로 감지하여 색상 전환
3. 좌측: 뷰 모드 버튼 (All / Urban / Rural / Bridge / Conference)
4. 우측: 노드 클릭 시 상세 패널 슬라이드 (Sheet 또는 커스텀)
5. 반응형: 모바일에서는 상세 패널이 하단 시트로
6. shadcn Card 컴포넌트로 감싸서 기존 UI와 일관성 유지

**테마 대응:**
```tsx
// 다크 모드
background: "hsl(var(--background))"  // 대시보드 배경과 동일
node text fill: "hsl(var(--muted-foreground))"
link stroke: "hsl(var(--border))"

// 라이트 모드에서는 자동 전환
```

**뷰 모드 (5가지):**
- All: 전체 노드/링크 표시
- Urban: 도시 축 + 관련 키워드만 하이라이트
- Rural: 농촌 축 + 관련 키워드만 하이라이트
- Bridge: 도시↔농촌 양쪽을 잇는 키워드만 하이라이트 (지표개발, 설문 등)
- Conference: 학생→키워드→학회 경로만 하이라이트

**노드 클릭 동작:**
1. 클릭한 노드 + 직접 연결된 노드만 하이라이트
2. 나머지 dim 처리
3. 우측 패널에 상세 정보 표시:
   - Overview (body HTML)
   - Action Items (actions 배열)
   - Connections 목록 (클릭하면 해당 노드로 이동)

**링크 종류별 스타일:**
- `link` (일반): 실선, 타겟 노드 색상, opacity 0.15
- `collab` (페어링): 점선(5,3), 학생 색상, opacity 0.4
- `kk` (키워드↔키워드): 점선(2,4), 흰색/회색, opacity 0.06

## 디자인 가이드라인

기존 대시보드 디자인과 일관성을 유지한다:
- `Card` 컴포넌트로 그래프 영역 감싸기
- `Button` variant="outline" 으로 뷰 모드 버튼
- `Badge` 로 키워드 태그 표시
- `Sheet` 또는 `Dialog` 로 상세 패널 (모바일 대응)
- 색상은 NODE_COLORS 사용하되, CSS 변수와 조화되게 opacity 조절

## 참고: 현재 작동하는 HTML 프로토타입

`C:\Users\1\Desktop\SDC_Lab_Research_Map.html` 에 완성된 독립 HTML이 있다.
D3.js 로직, 노드/링크 데이터, 인터랙션 코드가 모두 포함되어 있으므로
React 컴포넌트로 변환할 때 참고한다.
