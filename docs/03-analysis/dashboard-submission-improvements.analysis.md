# Analysis (Check): Dashboard 레이아웃 개편 + 투고 연구 주저자/빠른추가

> Feature: `dashboard-submission-improvements`
> Phase: Check · Date: 2026-06-08

## Context Anchor
WHY 투고 관리를 대시보드에서 한눈에·바로 / WHO 연구원·교수 / RISK first_author 이중표현 / SUCCESS 빌드+R1~R4 / SCOPE dashboard·card·new폼·actions

## 1. Success Criteria 검증

| SC | 내용 | 결과 | 증거 |
|----|------|------|------|
| SC1 | 다가오는 마감일 제거 + 투고 우측 세로 전체 | ✅ Met | `dashboard/page.tsx`: upcoming `UnifiedDeadlineView`/`upcomingDeadlines`/`calendarDeadlines` 제거. grid `md:grid-rows-2`, 투고 카드 `md:row-span-2 md:h-full`. 좌측 공지(상)+완료(하). |
| SC2 | 투고 카드 주저자 표시 + 인라인 편집 | ✅ Met | `SubmittedProjectsCard.tsx` `renderAuthorRow` (표시/Pencil 클릭 편집/Enter·Esc/저장·취소), `updateFirstAuthor` 액션 + optimistic update. |
| SC3 | 새 폼 주저자 입력 저장 | ✅ Met | `research/new/page.tsx` `firstAuthor` Input → `createProject({first_author})`; `createProject` insert에 `first_author` 반영. |
| SC4 | 카드 빠른추가 → 즉시 표시 | ✅ Met | 카드 헤더 "새 투고" Dialog → `createProject({submission_status:'submitted'})` → optimistic prepend + `router.refresh()`. submitted 상태라 activeProjects 필터 통과. |
| SC5 | 빌드/타입체크 통과, 회귀 없음 | ✅ Met | `tsc --noEmit` 0 errors; `next build` 성공(/dashboard, /research/new 포함 전 라우트 컴파일). |

## 2. 정적 일치도 (Design ↔ 구현)

- 변경 파일 4개 = 설계와 동일: `actions/research.ts`, `dashboard/page.tsx`, `SubmittedProjectsCard.tsx`, `research/new/page.tsx`. 마이그레이션 0(기존 `first_author` 컬럼 사용) — 설계대로.
- API 계약: `createProject(+first_author,+submission_status)`, `updateProject(+first_author)`, 신규 `updateFirstAuthor` — 설계 §4와 일치.
- **Match Rate: ~98%** (구조/함수/계약 모두 일치, 런타임 UI 수동확인은 사용자 몫).

## 3. 회귀 위험 점검

- `research/[id]/edit`는 `updateProject`를 first_author 없이 호출 → `!== undefined` 가드로 영향 없음. ✅
- 일반 새 프로젝트 생성: submission_status 미전달 → 조건부 분기 skip, 기존 동작 유지(not_submitted). ✅
- `createProject`는 여전히 생성자를 `project_members` first_author로 추가(기존). headline `first_author`(text)와 별개 — 의도된 분리. ⚠️ 문서화됨.

## 4. 남은 확인(사용자 런타임)
- `npm run dev`로 대시보드 시각 확인: 다가오는 마감일 없음, 투고 카드가 우측 세로로 길게, 주저자 표시/편집, 새 투고 추가.
- 상세페이지 "저자 정보"의 1저자와 대시보드 주저자(headline)는 별도 필드임을 인지.
