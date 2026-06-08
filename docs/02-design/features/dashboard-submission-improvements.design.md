# Design: Dashboard 레이아웃 개편 + 투고 연구 주저자/빠른추가

> Feature: `dashboard-submission-improvements`
> Phase: Design · Based on Plan (same name)

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 투고 연구 관리를 대시보드에서 한눈에·바로 |
| WHO | SDC Lab 연구원·교수 |
| RISK | first_author(headline) vs project_authors(상세) 이중 표현 |
| SUCCESS | 빌드 통과 + R1~R4 동작 |
| SCOPE | dashboard/page, SubmittedProjectsCard, research/new, actions/research |

## 1. Overview

선택 아키텍처: **Option C — Pragmatic Balance**.
- 주저자 quick 필드는 기존 `research_projects.first_author` 컬럼 사용(단일 컬럼, 조인 불필요, 마이그레이션 없음).
- 투고 카드/새 폼/빠른추가/인라인 편집 모두 이 컬럼을 읽고 쓴다.
- 상세페이지의 `project_authors` "저자 정보"는 상세 로스터로 유지(범위 밖).

### 아키텍처 옵션 비교 (요약)

| | A. 최소변경(first_author 컬럼) | B. 단일소스(project_authors) | C. 실용균형(채택) |
|---|---|---|---|
| 마이그레이션 | 불필요 | 불필요 | 불필요 |
| 인라인 편집 | 단일 컬럼 update | 관련테이블 upsert+조인 | 단일 컬럼 update |
| 이중표현 위험 | 있음(문서로 완화) | 없음 | 있음(문서로 완화) |
| 구현 비용 | 낮음 | 높음 | 낮음 |
| 결론 | — | 과설계 | **빠르고 안전** |

## 2. 변경 파일 & 설계

### 2.1 `src/lib/actions/research.ts`
- `ProjectFormData`에 `first_author?: string` 추가.
- `createProject`: insert에 `first_author: formData.first_author?.trim() || null`, `submission_status: formData.submission_status || undefined` 추가(빠른추가 시 'submitted' 지정). 기존 마일스톤/멤버/알림 로직 유지.
- `updateProject`: `if (formData.first_author !== undefined) updateData.first_author = formData.first_author || null;` 추가.
- 신규 액션 `updateFirstAuthor(projectId, firstAuthor)`: 단일 컬럼 update + `revalidatePath('/dashboard')`, `revalidatePath('/research/{id}')`.

### 2.2 `src/app/(dashboard)/dashboard/page.tsx`
- research_projects select에 `first_author` 추가.
- `upcomingDeadlines`, `calendarDeadlines` 계산 제거(완료 목표용 `goalDeadlines`/`completedDeadlines`는 유지). `UnifiedDeadlineView`(upcoming) 제거.
- 그리드: `grid-cols-1 md:grid-cols-2 md:grid-rows-2`. 배치(행 우선 흐름):
  - (r1,c1) `AnnouncementsSection` h-[600px] md:h-[675px]
  - (c2, row-span-2) `SubmittedProjectsCard` className `md:row-span-2 h-[600px] md:h-full`
  - (r2,c1) `UnifiedDeadlineView` 완료된 목표 h-[600px] md:h-[675px]
- `projectList` 타입과 `activeProjects/archivedProjects`에 `first_author` 포함.

### 2.3 `src/components/features/SubmittedProjectsCard.tsx`
- `Project` 타입에 `first_author: string | null` 추가.
- `renderProjectItem`: 저널 옆/아래에 주저자 표시. 클릭 시 인라인 편집(Input + 저장/취소, optimistic update, `updateFirstAuthor` 호출).
- 헤더에 "새 투고" 버튼 → Dialog(title, target_journal, first_author, submission_status select) → `createProject({...submission_status:'submitted'})` → `router.refresh()`.
- `useRouter` 추가. 인라인 편집 상태(`editingId`, `editValue`) 관리.

### 2.4 `src/app/(dashboard)/research/new/page.tsx`
- `firstAuthor` state + "주저자" Input(저널/일정 카드 또는 기본정보 카드) 추가 → `createProject({ first_author: firstAuthor })`.

## 3. Data Model
- 변경 없음. 기존 `research_projects.first_author text null` 사용. enum `submission_status` 값 활용(`submitted` 등).

## 4. API/Action Contract
| Action | Input | Effect |
|--------|-------|--------|
| createProject | +first_author, +submission_status | insert 시 컬럼 반영 |
| updateProject | +first_author | update 시 컬럼 반영 |
| updateFirstAuthor | projectId, firstAuthor | first_author 단일 update + revalidate |

## 5. Test Plan
- L1: 빌드/타입체크 통과.
- L2: 대시보드 렌더(다가오는 마감일 없음, 투고 우측 길게, 주저자 표시).
- L3: 새 폼 주저자 저장 → 상세/대시보드 반영. 카드 인라인 편집 저장. 카드 빠른추가 → 즉시 표시.

## 6. Risks & Mitigation
- 이중표현: 상세 "저자 정보"와 headline first_author가 다를 수 있음 → 본 범위는 headline 중심, 문서화로 완화.
- ISR 캐시: 액션에서 `revalidatePath('/dashboard')` + 클라이언트 `router.refresh()`로 즉시 갱신.
