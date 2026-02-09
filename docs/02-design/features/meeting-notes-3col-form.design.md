# Design: Meeting Notes 3-Column Input Form (미팅 기록 3단 입력 폼)

## Feature Name
`meeting-notes-3col-form`

## References
- Plan: `docs/01-plan/features/meeting-notes-3col-form.plan.md`
- Base Feature: `research-meeting-notes` (기존 구현 위에 개선)

---

## 1. Database Schema Changes

### 1.1 ALTER TABLE: `research_meetings`

기존 테이블에 `previous_content` 컬럼을 추가하여 3단 구조를 지원한다.

```sql
-- Migration: 00018_add_previous_content_to_meetings.sql

ALTER TABLE research_meetings
  ADD COLUMN IF NOT EXISTS previous_content TEXT;

COMMENT ON COLUMN research_meetings.previous_content IS '이전 미팅 주요 내용 요약';
```

**현재 스키마:**
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | NO | PK |
| project_id | UUID | NO | FK -> research_projects |
| meeting_date | DATE | NO | 미팅 날짜 |
| discussion_content | TEXT | NO | 오늘 회의 내용 |
| next_steps | TEXT | YES | 다음 미팅까지 할 일 |
| **previous_content** | **TEXT** | **YES** | **이전 미팅 주요 내용 (신규)** |
| author_id | UUID | NO | 작성자 |
| created_at | TIMESTAMPTZ | NO | 생성일 |
| updated_at | TIMESTAMPTZ | NO | 수정일 |

**기존 RLS 정책:** 변경 불필요 (컬럼 추가만이므로 기존 정책 유지)

**Migration File:** `supabase/migrations/00018_add_previous_content_to_meetings.sql`

---

## 2. TypeScript Types

### 2.1 `src/types/database.types.ts` 수정

**ResearchMeeting 인터페이스:**
```typescript
export interface ResearchMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  discussion_content: string;
  next_steps: string | null;
  previous_content: string | null;  // 신규 추가
  author_id: string;
  created_at: string;
  updated_at: string;
}
```

**Database Tables 타입:**
```typescript
research_meetings: {
  Row: {
    // ... 기존 필드 ...
    previous_content: string | null;  // 신규 추가
  };
  Insert: {
    // ... 기존 필드 ...
    previous_content?: string | null;  // 신규 추가
  };
  Update: {
    // ... 기존 필드 ...
    previous_content?: string | null;  // 신규 추가
  };
};
```

---

## 3. Server Actions

### 3.1 `src/lib/actions/research.ts` 수정

**addMeeting 시그니처 변경:**
```typescript
export async function addMeeting(
  projectId: string,
  meetingDate: string,
  discussionContent: string,
  nextSteps?: string,
  previousContent?: string  // 신규 파라미터
): Promise<ActionResult>
```

**addMeeting insert 변경:**
```typescript
.insert({
  project_id: projectId,
  meeting_date: meetingDate,
  discussion_content: discussionContent.trim(),
  next_steps: nextSteps?.trim() || null,
  previous_content: previousContent?.trim() || null,  // 신규
  author_id: user.id,
} as never)
```

**updateMeeting 시그니처 변경:**
```typescript
export async function updateMeeting(
  meetingId: string,
  projectId: string,
  meetingDate: string,
  discussionContent: string,
  nextSteps?: string | null,
  previousContent?: string | null  // 신규 파라미터
): Promise<ActionResult>
```

**updateMeeting update 변경:**
```typescript
.update({
  meeting_date: meetingDate,
  discussion_content: discussionContent.trim(),
  next_steps: nextSteps?.trim() || null,
  previous_content: previousContent?.trim() || null,  // 신규
} as never)
```

**deleteMeeting:** 변경 없음

---

## 4. Components

### 4.1 MeetingNotesSection 재설계

**File:** `src/components/features/research/meeting-notes-section.tsx`

**Props (변경 없음):**
```typescript
interface MeetingNotesProps {
  projectId: string;
  meetings: ResearchMeeting[];
  onRefresh: () => void;
}
```

#### 4.1.1 상태 관리 변경

**기존 상태 유지:**
- `isEditOpen`, `showOlder`, `saving`, `editingMeeting` 등

**변경/추가 상태:**
```typescript
// 기존 isAddOpen (Dialog) → isFormOpen (인라인 폼 토글)
const [isFormOpen, setIsFormOpen] = useState(false);

// Add form - 3단 구조
const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
const [newPreviousContent, setNewPreviousContent] = useState("");   // 신규
const [newContent, setNewContent] = useState("");
const [newNextSteps, setNewNextSteps] = useState("");

// Edit form - previous_content 추가
const [editPreviousContent, setEditPreviousContent] = useState(""); // 신규
```

#### 4.1.2 UI 레이아웃 (재설계)

**전체 구조:**
```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 미팅 기록                                       [+ 미팅 추가] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ 저번 미팅 내용 ─────┐ ┌─ 오늘 회의 내용 ─────┐ ┌─ 다음번 해올 내용 ──┐ │
│ │ (bg-muted/30)        │ │ (border-primary,     │ │ (bg-orange)         │ │
│ │ 📅 날짜              │ │  bg-primary/5)       │ │ 📅 날짜             │ │
│ │ 내용 표시            │ │ 📅 날짜              │ │ 내용 표시           │ │
│ │ [수정][삭제]         │ │ 내용 표시            │ │                     │ │
│ │                      │ │ [수정][삭제]         │ │                     │ │
│ └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│                                                                  │
│ ┌─ 3단 입력 폼 (isFormOpen=true 시 표시) ─────────────────────────┐ │
│ │                                                                │ │
│ │ ┌─ 이전 미팅 내용 ──┐ ┌─ 오늘 미팅 내용 ──┐ ┌─ 다음번 할 일 ───┐ │ │
│ │ │ 📅 [날짜 입력]    │ │ 📅 [날짜 입력]    │ │ 📅 [날짜 입력]    │ │ │
│ │ │                   │ │                   │ │                   │ │ │
│ │ │ [  textarea     ] │ │ [  textarea     ] │ │ [  textarea     ] │ │ │
│ │ │ placeholder:      │ │ placeholder:      │ │ placeholder:      │ │ │
│ │ │ "이전 미팅에서    │ │ "오늘 미팅에서    │ │ "다음 미팅까지    │ │ │
│ │ │  논의한 내용..."  │ │  논의한 내용..."  │ │  할 작업들..."    │ │ │
│ │ └───────────────────┘ └───────────────────┘ └───────────────────┘ │ │
│ │                                                                │ │
│ │                              [취소]  [💾 저장]                  │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [▼ 이전 미팅 기록 더보기 (N건)]                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.1.3 인라인 3단 입력 폼 상세 설계

**"미팅 추가" 버튼 클릭 시 동작 변경:**
- 기존: Dialog 모달 열림
- 변경: `isFormOpen` 토글 → 3단 컬럼 레이아웃 시 기존 표시 영역과 이전 미팅 기록 더보기 사이에 인라인 입력 폼 노출

**3단 입력 폼 HTML 구조:**
```tsx
{isFormOpen && (
  <Card className="border-2 border-dashed border-primary/40 bg-primary/5">
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 좌측: 이전 미팅 내용 */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <History className="h-4 w-4" />
            이전 미팅 주요 내용
          </Label>
          <Input
            type="date"
            value={/* 이전 미팅 날짜는 참고용 read-only 또는 별도 관리 */}
            disabled
            className="text-sm"
          />
          <Textarea
            value={newPreviousContent}
            onChange={(e) => setNewPreviousContent(e.target.value)}
            placeholder="이전 미팅에서 논의한 내용을 작성하세요..."
            className="min-h-[120px]"
          />
        </div>

        {/* 가운데: 오늘 미팅 내용 */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-primary">
            <MessageSquare className="h-4 w-4" />
            오늘 미팅 주요 내용
          </Label>
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="text-sm"
          />
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="오늘 미팅에서 논의한 내용을 작성하세요..."
            className="min-h-[120px]"
          />
        </div>

        {/* 우측: 다음번 해올 내용 */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
            <ClipboardList className="h-4 w-4" />
            다음번 미팅 전 해올 내용
          </Label>
          <Input
            type="date"
            placeholder="다음 미팅 예정일"
            className="text-sm"
          />
          <Textarea
            value={newNextSteps}
            onChange={(e) => setNewNextSteps(e.target.value)}
            placeholder="다음 미팅까지 완료해야 할 작업들을 작성하세요..."
            className="min-h-[120px]"
          />
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setIsFormOpen(false)}>
          취소
        </Button>
        <Button onClick={handleAdd} disabled={!newContent.trim() || saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          저장
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

#### 4.1.4 날짜 필드 설계

| 컬럼 | 날짜 필드 | 용도 | 동작 |
|------|----------|------|------|
| 좌측 (이전 미팅) | 읽기 전용 | 이전 미팅의 meeting_date 표시 | `previousMeeting?.meeting_date` 자동 표시, 폼에서는 빈 값이나 직접 입력 가능 |
| 가운데 (오늘 미팅) | 편집 가능 | 오늘 미팅 날짜 (= `meeting_date`) | 기본값: 오늘 날짜 `new Date().toISOString().split("T")[0]` |
| 우측 (다음 해올 내용) | 편집 가능 | 다음 미팅 예정일 (참고용) | 저장되지 않음 (참고 정보). 실제 저장은 `next_steps` 텍스트만 |

**설계 결정:** 날짜는 가운데 컬럼의 `meeting_date`만 실제 DB에 저장됨. 좌측/우측 날짜는 UX 참고용.

#### 4.1.5 handleAdd 변경

```typescript
const handleAdd = async () => {
  if (!newContent.trim()) return;
  setSaving(true);

  const result = await addMeeting(
    projectId,
    newDate,
    newContent,
    newNextSteps,
    newPreviousContent  // 신규 파라미터
  );

  if (result.error) {
    alert(result.error);  // 간단한 에러 핸들링
    setSaving(false);
    return;
  }

  // 폼 초기화
  setNewDate(new Date().toISOString().split("T")[0]);
  setNewPreviousContent("");
  setNewContent("");
  setNewNextSteps("");
  setIsFormOpen(false);
  setSaving(false);
  onRefresh();
};
```

#### 4.1.6 Edit Dialog 변경

기존 Edit Dialog에 `previous_content` 필드를 추가한다.

```typescript
const handleEdit = (meeting: ResearchMeeting) => {
  setEditingMeeting(meeting);
  setEditDate(meeting.meeting_date);
  setEditPreviousContent(meeting.previous_content || "");  // 신규
  setEditContent(meeting.discussion_content);
  setEditNextSteps(meeting.next_steps || "");
  setIsEditOpen(true);
};

const handleSaveEdit = async () => {
  if (!editingMeeting || !editContent.trim()) return;
  setSaving(true);

  const result = await updateMeeting(
    editingMeeting.id,
    projectId,
    editDate,
    editContent,
    editNextSteps,
    editPreviousContent  // 신규
  );

  if (result.error) {
    alert(result.error);
    setSaving(false);
    return;
  }

  setEditingMeeting(null);
  setIsEditOpen(false);
  setSaving(false);
  onRefresh();
};
```

**Edit Dialog UI 변경:**
- 기존 2필드 (회의 내용, 다음 할 일) → 3필드 (이전 미팅 내용, 회의 내용, 다음 할 일)
- `previous_content` Textarea 추가 (Label: "이전 미팅 주요 내용")

#### 4.1.7 3단 표시 영역 변경

기존 3단 표시 영역에서 `previous_content`가 있으면 좌측 컬럼에 해당 미팅 자체의 `previous_content`를 표시하고, 없으면 기존처럼 `sortedMeetings[1].discussion_content`를 표시한다.

```typescript
// 좌측 컬럼 표시 로직
const leftColumnContent = latestMeeting?.previous_content
  ? { text: latestMeeting.previous_content, type: "previous_content" as const }
  : previousMeeting
  ? { text: previousMeeting.discussion_content, date: previousMeeting.meeting_date, type: "fallback" as const }
  : null;
```

---

## 5. Responsive Design

**데스크톱 (md 이상):**
```
grid grid-cols-3 gap-4
```
- 3단 컬럼 수평 배치
- 각 컬럼 동일 너비 (1fr)

**모바일 (md 미만):**
```
grid grid-cols-1 gap-4
```
- 3단이 세로로 스택
- 순서: 이전 미팅 → 오늘 미팅 → 다음 할 일

**입력 폼도 동일한 반응형:**
```
grid grid-cols-1 md:grid-cols-3 gap-4
```

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| 인증 안됨 | `result.error` → alert 표시 |
| 권한 없음 (RLS 42501) | Server Action에서 한국어 메시지 반환 → alert |
| 빈 회의 내용 | 클라이언트: `!newContent.trim()` → 버튼 disabled |
| 서버 오류 | `result.error` → alert 표시, saving 상태 해제 |
| 저장 성공 | 폼 초기화 + 닫기 + onRefresh 호출 |

---

## 7. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/00018_add_previous_content_to_meetings.sql` | **CREATE** | previous_content 컬럼 추가 |
| `src/types/database.types.ts` | **EDIT** | ResearchMeeting에 previous_content 추가 (인터페이스 + Row/Insert/Update) |
| `src/lib/actions/research.ts` | **EDIT** | addMeeting, updateMeeting에 previousContent 파라미터 추가 |
| `src/components/features/research/meeting-notes-section.tsx` | **EDIT** | Dialog → 인라인 3단 폼, previous_content 지원, 에러 핸들링 |

---

## 8. Implementation Order

```
Step 1: DB Migration
  └── 00018_add_previous_content_to_meetings.sql (previous_content 컬럼 추가)

Step 2: TypeScript Types
  └── database.types.ts (ResearchMeeting + Row/Insert/Update에 previous_content 추가)

Step 3: Server Actions
  └── research.ts (addMeeting, updateMeeting 시그니처 및 쿼리 변경)

Step 4: Component Redesign
  └── meeting-notes-section.tsx
      ├── Dialog 기반 추가 → 인라인 3단 폼으로 변경
      ├── previous_content 상태 및 입력 추가
      ├── handleAdd/handleEdit에 에러 핸들링 추가
      ├── Edit Dialog에 previous_content 필드 추가
      └── 좌측 컬럼 표시 로직 변경 (previous_content 우선)
```

---

## 9. Data Flow

```
[미팅 추가 버튼 클릭]
    ↓
isFormOpen = true → 인라인 3단 폼 표시
    ↓
사용자가 3단 입력 (이전 내용 / 오늘 내용 / 다음 할 일)
    ↓
[저장 버튼 클릭]
    ↓
addMeeting(projectId, newDate, newContent, newNextSteps, newPreviousContent)
    ↓
Server Action → Supabase INSERT (previous_content 포함)
    ↓
성공 → 폼 초기화 + isFormOpen=false + onRefresh()
실패 → alert(error) + saving=false
    ↓
Page fetchData() → 최신 미팅 데이터 반영
```

---

## 10. Edge Cases & Constraints

1. **previous_content가 null인 기존 데이터**: 좌측 컬럼에서 `previous_content`가 없으면 `sortedMeetings[1].discussion_content`로 폴백 표시
2. **미팅 0건일 때 폼 열기**: 빈 상태 안내 메시지 대신 인라인 폼만 표시
3. **가운데 컬럼 필수**: `discussion_content`(오늘 미팅 내용)는 필수, 나머지 2컬럼은 선택
4. **날짜 형식**: 한국 로케일 YYYY-MM-DD, `formatMeetingDate()`로 "2026. 2. 9. (월)" 형식 표시
5. **같은 날 여러 미팅**: `meeting_date` + `created_at` DESC 정렬 유지
6. **폼 열린 상태에서 스크롤**: 폼이 화면에 보이도록 스크롤 위치 자연스럽게 유지
7. **에러 시 폼 유지**: 저장 실패 시 폼을 닫지 않고 사용자 입력 유지
