# Plan: Meeting Notes 3-Column Input Form (미팅 기록 3단 입력 폼)

## Feature Name
`meeting-notes-3col-form`

## Overview
연구 프로젝트 상세 페이지(/research/[id])의 미팅 기록 섹션 UI를 개선하여, 학생이 3단 컬럼 레이아웃의 인라인 폼에서 직접 미팅 내용을 입력할 수 있도록 재설계한다.

## Background & Motivation
- 현재 미팅 기록은 3단 컬럼으로 **표시**만 되고, 입력은 Dialog(모달) 팝업을 통해 이루어짐
- 학생이 미팅 내용을 입력할 때 모달이 아닌 페이지 내 인라인 폼으로 바로 작성하면 UX가 더 직관적임
- "이전 미팅 내용 → 오늘 미팅 내용 → 다음번 할 일"의 시간 흐름을 입력 단계에서도 3단으로 보여주어 맥락을 유지
- 각 컬럼에 날짜 입력을 두어 미팅 일정 관리를 명확히 함

## Requirements

### 1. 3단 컬럼 입력 폼 (Inline Form)
현재 Dialog 기반 미팅 추가를 **인라인 3단 컬럼 폼**으로 변경한다.

**좌측 컬럼: 이전 미팅 주요 내용**
- 상단에 날짜 입력 (type="date", YYYY-MM-DD)
- 제목 레이블 + Textarea 입력 필드
- placeholder: "이전 미팅에서 논의한 내용을 작성하세요..."

**가운데 컬럼: 오늘 미팅 주요 내용**
- 상단에 날짜 입력 (type="date", YYYY-MM-DD, 기본값: 오늘)
- 제목 레이블 + Textarea 입력 필드
- placeholder: "오늘 미팅에서 논의한 내용을 작성하세요..."

**우측 컬럼: 다음번 미팅 전 해올 내용**
- 상단에 날짜 입력 (type="date", YYYY-MM-DD)
- 제목 레이블 + Textarea 입력 필드
- placeholder: "다음 미팅까지 완료해야 할 작업들을 작성하세요..."

### 2. 미팅 추가/저장 기능
- "미팅 추가" 버튼 클릭 시 3단 입력 폼이 노출됨
- 폼 하단에 "저장" 버튼 배치
- 저장 시 Supabase research_meetings 테이블에 데이터 저장
- 저장 성공/실패 시 적절한 에러 핸들링 및 피드백

### 3. DB 스키마 확장
현재 `research_meetings` 테이블은 `discussion_content`(오늘 회의 내용)와 `next_steps`(다음 할 일)만 지원.
- `previous_content` TEXT 컬럼 추가 (이전 미팅 주요 내용)
- 기존 `discussion_content` → 오늘 미팅 내용으로 계속 사용
- 기존 `next_steps` → 다음번 해올 내용으로 계속 사용

### 4. 기존 미팅 기록 목록 유지
- 하단에 기존 미팅 기록 목록은 그대로 유지
- 새로운 3단 입력 폼과 시각적으로 구분

### 5. 반응형 디자인
- 모바일(md 이하): 3단이 세로로 스택
- 데스크톱(md 이상): 3단 컬럼 수평 배치
- Tailwind CSS `grid grid-cols-1 md:grid-cols-3 gap-4` 활용

### 6. shadcn/ui 컴포넌트 활용
- Card, CardContent, CardHeader, CardTitle
- Input (날짜), Textarea (내용)
- Button (저장/취소)
- Label

## Scope

### In Scope
- MeetingNotesSection 컴포넌트 UI 재설계 (인라인 3단 입력 폼)
- Supabase research_meetings 테이블에 `previous_content` 컬럼 추가
- Server Action 수정 (addMeeting에 previous_content 파라미터 추가)
- TypeScript 타입 업데이트 (ResearchMeeting에 previous_content 필드 추가)
- 반응형 디자인 (모바일 스택)
- 에러 핸들링 (저장 성공/실패 피드백)

### Out of Scope
- 기존 미팅 기록 데이터 마이그레이션 (기존 데이터는 previous_content가 null)
- 미팅 기록 파일 첨부
- 알림 연동
- 미팅 기록 검색/필터

## Database Changes

### ALTER TABLE: `research_meetings`
```sql
ALTER TABLE research_meetings
  ADD COLUMN IF NOT EXISTS previous_content TEXT;
```

## Affected Files
- `src/components/features/research/meeting-notes-section.tsx` - 3단 인라인 입력 폼 UI 구현
- `src/lib/actions/research.ts` - addMeeting, updateMeeting에 previous_content 파라미터 추가
- `src/types/database.types.ts` - ResearchMeeting 인터페이스에 previous_content 추가
- `supabase/migrations/` - 새 migration 파일 (previous_content 컬럼 추가)

## Implementation Order
1. DB 마이그레이션 작성 (previous_content 컬럼 추가)
2. TypeScript 타입 업데이트
3. Server Actions 수정 (addMeeting, updateMeeting)
4. MeetingNotesSection 컴포넌트 3단 인라인 입력 폼 재설계
5. 반응형 디자인 확인
6. 에러 핸들링 테스트

## Success Criteria
- 미팅 추가 시 3단 컬럼 인라인 폼이 표시된다
- 각 컬럼에 날짜 입력과 내용 입력이 가능하다
- 저장 버튼 클릭 시 Supabase에 정상 저장된다
- 기존 미팅 기록 목록이 하단에 유지된다
- 모바일에서 3단이 세로로 스택된다
- 에러 발생 시 사용자에게 적절한 피드백이 표시된다
