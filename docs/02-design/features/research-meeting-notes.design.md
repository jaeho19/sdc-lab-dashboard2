# Design: Research Meeting Notes (연구별 미팅 기록)

## Feature Name
`research-meeting-notes`

## References
- Plan: `docs/01-plan/features/research-meeting-notes.plan.md`

---

## 1. Database Schema

### 1.1 New Table: `research_meetings`

```sql
CREATE TABLE IF NOT EXISTS research_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    discussion_content TEXT NOT NULL,     -- 오늘 회의 내용
    next_steps TEXT,                      -- 다음 미팅까지 할 일
    author_id UUID NOT NULL,             -- 작성자 (members.id = auth.uid())
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_research_meetings_project ON research_meetings(project_id);
CREATE INDEX idx_research_meetings_date ON research_meetings(meeting_date DESC);
```

**RLS Policies:**
```sql
-- 조회: 인증 사용자 전체
CREATE POLICY "Research meetings are viewable by authenticated users"
    ON research_meetings FOR SELECT TO authenticated USING (true);

-- CUD: 프로젝트 멤버, 생성자, 교수
CREATE POLICY "Project members can manage research meetings"
    ON research_meetings FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = research_meetings.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = research_meetings.project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'
        )
    );
```

**Migration File:** `supabase/migrations/00017_create_research_meetings.sql`

---

## 2. TypeScript Types

### 2.1 `src/types/database.types.ts` 추가

```typescript
export interface ResearchMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  discussion_content: string;
  next_steps: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}
```

---

## 3. Server Actions

### 3.1 `src/lib/actions/research.ts` 에 추가

| Action | Signature | Description |
|--------|-----------|-------------|
| `addMeeting` | `(projectId, meetingDate, discussionContent, nextSteps?) => ActionResult` | 미팅 기록 생성 |
| `updateMeeting` | `(meetingId, projectId, meetingDate, discussionContent, nextSteps?) => ActionResult` | 미팅 기록 수정 |
| `deleteMeeting` | `(meetingId, projectId) => ActionResult` | 미팅 기록 삭제 |

**패턴:** 기존 `addWeeklyGoal`, `updateWeeklyGoal`, `deleteWeeklyGoal`과 동일한 패턴 사용
- `createClient()` 로 인증 확인
- `revalidatePath(\`/research/\${projectId}\`)` 호출
- `as never` 타입 캐스팅 패턴 유지

---

## 4. Components

### 4.1 MeetingNotesSection (신규)

**File:** `src/components/features/research/meeting-notes-section.tsx`

**Props:**
```typescript
interface MeetingNotesProps {
  projectId: string;
  meetings: ResearchMeeting[];
  onRefresh: () => void;
}
```

**UI Layout (3단 컬럼):**

3단 컬럼 그리드로 최근 미팅 정보를 한눈에 비교할 수 있도록 배치. 모바일에서는 1단 세로 배치 (responsive).

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 미팅 기록                                       [+ 미팅 추가] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ 저번 미팅 내용 ─────┐ ┌─ 오늘 회의 내용 ─────┐ ┌─ 다음번 해올 내용 ──┐ │
│ │ (bg-muted/30)        │ │ (border-primary,     │ │ (bg-orange)         │ │
│ │                      │ │  bg-primary/5)       │ │                     │ │
│ │ 🕐 History 아이콘    │ │ 💬 MessageSquare     │ │ 📋 ClipboardList    │ │
│ │                      │ │                      │ │                     │ │
│ │ 📅 2026-01-31 (금)   │ │ 📅 2026-02-07 (금)   │ │                     │ │
│ │ [수정][삭제]         │ │ [수정][삭제]         │ │                     │ │
│ │                      │ │                      │ │                     │ │
│ │ 이전 미팅의          │ │ 최근 미팅의          │ │ 최근 미팅의         │ │
│ │ discussion_content   │ │ discussion_content   │ │ next_steps          │ │
│ │                      │ │                      │ │                     │ │
│ └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│                                                                  │
│ [▼ 이전 미팅 기록 더보기 (3건)]                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**컬럼 데이터 매핑:**
- 좌측 (저번 미팅 내용): `sortedMeetings[1].discussion_content` (두 번째 최근 미팅)
- 가운데 (오늘 회의 내용): `sortedMeetings[0].discussion_content` (가장 최근 미팅)
- 우측 (다음번 해올 내용): `sortedMeetings[0].next_steps` (가장 최근 미팅)

**빈 상태 처리:**
- 미팅 0건: 전체 빈 상태 메시지 (아이콘 + 안내)
- 미팅 1건: 좌측 "이전 미팅 기록이 없습니다" 표시
- `next_steps` 없을 때: 우측 "다음 미팅까지 할 일이 없습니다" 표시

**Responsive:**
- `md` 이상: `grid-cols-3` (3단 컬럼)
- `md` 미만: `grid-cols-1` (1단 세로 배치)

**동작:**
1. 미팅 기록을 `meeting_date` + `created_at` 기준 최신순(DESC) 정렬
2. **가장 최근 미팅**: 가운데 컬럼에 `discussion_content`, 우측 컬럼에 `next_steps`
3. **두 번째 최근 미팅**: 좌측 컬럼에 `discussion_content`
4. **나머지**: "이전 미팅 기록 더보기 (N건)" 접기/펼치기 토글 (기존 카드 형식)
5. 미팅 추가: Dialog로 날짜, 회의내용, 다음 할일 입력
6. 수정/삭제: 각 컬럼 및 이전 미팅 카드에 버튼

**미팅 추가 Dialog:**
```
┌─────────────────────────────────────┐
│ 미팅 기록 추가                       │
├─────────────────────────────────────┤
│                                     │
│ 미팅 날짜                            │
│ [   2026-02-07          📅]         │
│                                     │
│ 회의 내용                            │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 다음 미팅까지 할 일 (선택)            │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│          [취소]  [추가]              │
└─────────────────────────────────────┘
```

**사용 컴포넌트:**
- `Card`, `CardHeader`, `CardTitle`, `CardContent` (UI)
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` (추가/수정)
- `Button`, `Input` (type=date), `Textarea` (입력)
- `Loader2`, `Plus`, `Edit2`, `Trash2`, `ChevronDown`, `ChevronUp`, `MessageSquare`, `CalendarDays`, `ClipboardList`, `History` (아이콘)

---

### 4.2 ProjectTimeline 간소화

**File:** `src/components/features/research/project-timeline.tsx`

**변경 방향:** 기존 Gantt 차트를 **심플 진행 상태 리스트**로 교체

**간소화된 UI:**
```
┌─────────────────────────────────────────────────┐
│ 📅 프로젝트 일정                     [▲ 접기]    │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. 문헌조사       ████████████████  100%  완료   │
│  2. 방법론 설계    ██████████░░░░░░   60%  진행중  │
│  3. 데이터 수집    ░░░░░░░░░░░░░░░░    0%  미시작  │
│  4. 분석           ░░░░░░░░░░░░░░░░    0%  미시작  │
│  5. 초고 작성      ░░░░░░░░░░░░░░░░    0%  미시작  │
│  6. 투고           ░░░░░░░░░░░░░░░░    0%  미시작  │
│  7. 심사 수정      ░░░░░░░░░░░░░░░░    0%  미시작  │
│  8. 출판           ░░░░░░░░░░░░░░░░    0%  미시작  │
│                                                  │
│  마감일: 2026-06-30 (D-141)                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

**변경 사항:**
- Gantt 차트 헤더(월/주차) 제거
- 바 위치 계산 로직 제거
- 마일스톤 날짜 편집 Dialog 제거
- 오늘 표시선 제거
- 목표 기반 타임라인 모드 제거
- **유지:** 마일스톤별 progress bar + 상태 배지
- **유지:** 접기/펼치기 토글
- **추가:** 마감일 D-day 표시 (하단)

---

### 4.3 ResearchFlowchart MD 다운로드

**File:** `src/components/features/research/research-flowchart.tsx`

**변경:** 비편집 모드에서 "다운로드" 버튼 추가

```typescript
const handleDownload = () => {
  if (!flowchartMd) return;
  const blob = new Blob([flowchartMd], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectTitle}_흐름도.md`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**UI 변경:**
```
┌─────────────────────────────────────────────────┐
│ 📄 연구 흐름도                  [⬇ 다운로드] [✏ 편집] │
```

- `Download` 아이콘 (lucide-react) 사용
- `flowchartMd`가 있을 때만 다운로드 버튼 표시
- Props에 `projectTitle: string` 추가 필요

---

## 5. Page Integration

### 5.1 `src/app/(dashboard)/research/[id]/page.tsx` 변경

**데이터 패칭 추가:**
```typescript
// 미팅 기록 조회
const { data: meetingsData } = await supabase
  .from("research_meetings")
  .select("*")
  .eq("project_id", id)
  .order("meeting_date", { ascending: false });

setMeetings((meetingsData || []) as ResearchMeeting[]);
```

**렌더링 순서 변경:**
```
1. Header (유지)
2. Project Info Card (유지)
3. WeeklyGoals - 이번달 목표 (유지)
4. MeetingNotesSection - 미팅 기록 (신규 - 목표 바로 아래)
5. ProjectTimeline - 프로젝트 일정 (간소화)
6. 단계별 진행 현황 (유지)
7. ResearchNotesSection - 연구노트 (유지)
8. ResearchFlowchart - 연구 흐름도 (다운로드 추가)
9. 저자 정보 (유지)
```

**Import 추가:**
```typescript
import { MeetingNotesSection } from "@/components/features/research/meeting-notes-section";
```

**State 추가:**
```typescript
const [meetings, setMeetings] = useState<ResearchMeeting[]>([]);
```

---

## 6. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/00017_create_research_meetings.sql` | **CREATE** | 미팅 기록 테이블, RLS, 인덱스, 트리거 |
| `src/types/database.types.ts` | **EDIT** | `ResearchMeeting` 인터페이스 추가 |
| `src/lib/actions/research.ts` | **EDIT** | `addMeeting`, `updateMeeting`, `deleteMeeting` 추가 |
| `src/components/features/research/meeting-notes-section.tsx` | **CREATE** | 미팅 기록 컴포넌트 |
| `src/components/features/research/project-timeline.tsx` | **EDIT** | Gantt 차트 -> 심플 리스트로 간소화 |
| `src/components/features/research/research-flowchart.tsx` | **EDIT** | 다운로드 버튼 추가, Props에 projectTitle 추가 |
| `src/app/(dashboard)/research/[id]/page.tsx` | **EDIT** | 미팅 데이터 패칭, MeetingNotesSection 추가, 렌더링 순서 조정 |

---

## 7. Implementation Order

```
Step 1: DB Migration
  └── 00017_create_research_meetings.sql

Step 2: Types
  └── database.types.ts (ResearchMeeting 추가)

Step 3: Server Actions
  └── research.ts (addMeeting, updateMeeting, deleteMeeting)

Step 4: Meeting Notes Component
  └── meeting-notes-section.tsx (신규)

Step 5: Page Integration
  └── research/[id]/page.tsx (미팅 데이터 + 컴포넌트 연결)

Step 6: Timeline Simplification
  └── project-timeline.tsx (Gantt -> 심플 리스트)

Step 7: Flowchart Download
  └── research-flowchart.tsx (다운로드 버튼 + projectTitle prop)
  └── research/[id]/page.tsx (projectTitle prop 전달)
```

---

## 8. Data Flow

```
User Action          Server Action         Database              UI Update
────────────         ─────────────         ────────              ─────────
미팅 추가 클릭  →    addMeeting()    →    INSERT research_meetings → revalidate → fetchData()
미팅 수정      →    updateMeeting() →    UPDATE research_meetings → revalidate → fetchData()
미팅 삭제      →    deleteMeeting() →    DELETE research_meetings → revalidate → fetchData()
MD 다운로드    →    (client-side)   →    Blob download           → 없음
```

---

## 9. Edge Cases & Constraints

1. **미팅 기록 없을 때**: 빈 상태 안내 메시지 + "첫 미팅 기록 추가" 버튼
2. **미팅 1건만 있을 때**: 가운데/우측 컬럼만 표시, 좌측 컬럼은 "이전 미팅 기록이 없습니다" 메시지
3. **같은 날 여러 미팅**: meeting_date + created_at으로 정렬하여 구분
4. **긴 회의 내용**: Textarea에 작성, 줄바꿈 유지하여 표시 (`whitespace-pre-wrap`)
5. **흐름도 없을 때**: 다운로드 버튼 비활성화 (표시하지 않음)
6. **타임라인 마일스톤 없을 때**: "등록된 마일스톤이 없습니다" 메시지
