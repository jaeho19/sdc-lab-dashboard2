# Plan: Research Meeting Notes (연구별 미팅 기록)

## Feature Name
`research-meeting-notes`

## Overview
개별 연구(Research) 페이지에 지도교수 미팅 기록 섹션을 추가하고, 기존 프로젝트 타임라인을 간소화하며, 연구 흐름도에 MD 다운로드 기능을 추가한다.

## Background & Motivation
- 기존 Mentoring 섹션은 지도교수와의 미팅 후 내용을 기록하는 용도였으나, 개별 논문과 직접 연관시키기 어려움
- 각 연구 프로젝트 페이지에서 직접 미팅 내용을 기록하면 해당 연구의 진행 맥락과 함께 관리 가능
- 프로젝트 타임라인이 과도하게 복잡함 -> 간소화 필요
- 연구 흐름도를 MD 파일로 다운로드 받을 수 있는 기능 필요

## Requirements

### 1. 미팅 기록 섹션 (Meeting Notes Section)
개별 연구 페이지의 "이번달 목표" 아래에 미팅 기록 섹션을 추가한다.

**표시 내용:**
- **지난 미팅 회의 내용** (날짜 포함): 이전 미팅에서 논의한 내용 요약
- **오늘 회의 내용**: 현재 미팅에서 논의한 내용
- **다음 미팅 내용**: 다음 미팅까지 해야 할 것들, 준비 사항

**기능:**
- 미팅 기록 CRUD (생성/조회/수정/삭제)
- 미팅 날짜 기록
- 시간순 정렬 (최신 미팅이 위에)
- 최근 미팅과 바로 이전 미팅을 기본 표시, 나머지는 접기/펼치기
- 모든 연구 프로젝트에 동일하게 적용

### 2. 프로젝트 타임라인 간소화
- 현재 Gantt 차트 스타일 타임라인은 과도함
- 간단한 형태로 변경 (구체적 방향은 Design 단계에서 결정)

### 3. 연구 흐름도 MD 다운로드
- 기존 연구 흐름도(flowchart_md)를 `.md` 파일로 다운로드할 수 있는 버튼 추가
- 파일명: `{프로젝트제목}_흐름도.md`

### 4. 연구노트 유지
- 현재 연구노트(Research Notes) 기능은 그대로 유지

## Scope

### In Scope
- 새 Supabase 테이블: `research_meetings` (미팅 기록)
- 미팅 기록 UI 컴포넌트 (MeetingNotesSection)
- 미팅 기록 Server Actions (CRUD)
- 프로젝트 타임라인 간소화
- 연구 흐름도 MD 다운로드 버튼
- 모든 연구 프로젝트에 동일 적용

### Out of Scope
- 기존 Mentoring 페이지 삭제/변경 (기존 기능 유지)
- 알림 연동 (향후 추가 가능)
- 미팅 기록 파일 첨부 (향후 추가 가능)

## Database Changes

### New Table: `research_meetings`
```sql
CREATE TABLE research_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE NOT NULL,
  meeting_date DATE NOT NULL,
  discussion_content TEXT NOT NULL,       -- 오늘 회의 내용
  next_steps TEXT,                        -- 다음 미팅까지 할 일
  author_id UUID REFERENCES members(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Affected Files
- `src/app/(dashboard)/research/[id]/page.tsx` - 미팅 섹션 추가, 타임라인 간소화
- `src/components/features/research/meeting-notes-section.tsx` - **NEW** 미팅 기록 컴포넌트
- `src/components/features/research/project-timeline.tsx` - 간소화
- `src/components/features/research/research-flowchart.tsx` - 다운로드 버튼 추가
- `src/lib/actions/research.ts` - 미팅 기록 CRUD actions 추가
- `src/types/database.types.ts` - ResearchMeeting 타입 추가
- `supabase/migrations/` - 새 migration 파일

## Implementation Order
1. DB 스키마 설계 및 migration 작성
2. TypeScript 타입 정의
3. Server Actions 구현 (미팅 기록 CRUD)
4. MeetingNotesSection 컴포넌트 구현
5. 연구 상세 페이지에 미팅 섹션 통합
6. 프로젝트 타임라인 간소화
7. 연구 흐름도 MD 다운로드 기능 추가
8. 전체 테스트

## Success Criteria
- 각 연구 프로젝트 페이지에서 미팅 기록을 생성/조회/수정/삭제할 수 있다
- 최근 미팅과 이전 미팅 내용을 한눈에 볼 수 있다
- 프로젝트 타임라인이 간소화되어 표시된다
- 연구 흐름도를 MD 파일로 다운로드할 수 있다
- 모든 연구 프로젝트에 동일하게 적용된다
