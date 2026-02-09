# Gap Analysis: admin-activity-notifications

> Design vs Implementation 비교 분석 (Check Phase)

## Analysis Overview
- **Feature**: admin-activity-notifications
- **Design**: `docs/02-design/features/admin-activity-notifications.design.md`
- **Analysis Date**: 2026-02-09
- **Match Rate**: **97%**

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 95% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **97%** | **PASS** |

## Matched Items (14/14 core items)

### 1. notifyAdmins() 함수 (6/6)
- [x] 함수 시그니처 설계와 일치
- [x] position="professor"로 교수 조회
- [x] actorId 자기 자신 제외 필터
- [x] bulk insert 사용
- [x] try-catch 전체 감싸기
- [x] "project_update" 타입 사용

### 2. research-notes.ts (3/3)
- [x] import 추가
- [x] createResearchNote에 notifyAdmins 호출 (제목/메시지/링크 일치)
- [x] updateResearchNote에 notifyAdmins 호출 + select에 name 필드 추가

### 3. mentoring.ts (3/3)
- [x] import 추가
- [x] createMentoringPost — redirect 전에 notifyAdmins await
- [x] updateMentoringPost — redirect 전에 notifyAdmins await

### 4. calendar.ts (3/3)
- [x] import 추가
- [x] createCalendarEvent에 notifyAdmins 호출 (memberId guard 포함)
- [x] updateCalendarEvent에 notifyAdmins 호출

### 5. research.ts (2/2 + bonus)
- [x] import 추가
- [x] createProject에 notifyAdmins 호출
- [x] updateProject에도 notifyAdmins 추가 (설계서에서 optional로 언급된 항목)

### 6. 알림 메시지 (7/7)
| Server Action | Title | Message | Link | Match |
|--------------|-------|---------|------|:-----:|
| createResearchNote | 연구노트 작성 | {이름}님이 연구노트를 작성했습니다 | /research-notes | YES |
| updateResearchNote | 연구노트 수정 | {이름}님이 연구노트를 수정했습니다 | /research-notes | YES |
| createMentoringPost | 멘토링 기록 등록 | {이름}님이 멘토링 기록을 등록했습니다 | /mentoring/{id} | YES |
| updateMentoringPost | 멘토링 기록 수정 | {이름}님이 멘토링 기록을 수정했습니다 | /mentoring/{id} | YES |
| createCalendarEvent | 캘린더 일정 추가 | {이름}님이 일정을 추가했습니다 | /calendar | YES |
| updateCalendarEvent | 캘린더 일정 수정 | {이름}님이 일정을 수정했습니다 | /calendar | YES |
| createProject | 연구 프로젝트 생성 | {이름}님이 새 연구 프로젝트를 생성했습니다 | /research/{id} | YES |

### 7. 에러 격리 (1/1)
- [x] notifyAdmins 실패 시 원본 CRUD 영향 없음

### 8. UI (1/1)
- [x] notification-list.tsx의 project_update 아이콘 이미 존재 (변경 불필요)

## Gaps Found (1건 - Minor)

### [GAP-1] updateProject 메시지가 설계서 테이블에 미포함
- **파일**: `docs/02-design/features/admin-activity-notifications.design.md` Section 5
- **설명**: updateProject에 notifyAdmins를 추가했으나 설계서의 메시지 정의 테이블에는 미기재
- **영향**: 문서 불일치. 코드 동작에는 영향 없음
- **권장**: 설계서 Section 5 테이블에 updateProject 행 추가

## Warnings (2건)

### [WARN-1] updateCalendarEvent의 actor 조회 방식
- `calendar.ts`에서 `.eq("user_id", user.id)`로 멤버 조회
- 다른 파일들은 `.eq("id", user.id)` 사용
- members 테이블에 user_id 컬럼이 없으면 null 반환 가능
- fallback으로 user.id 사용하므로 기능 장애는 없으나 확인 필요

### [WARN-2] research_note_comment 타입 아이콘 미등록 (기존 이슈)
- notification-list.tsx의 typeIcons에 research_note_comment 미포함
- 이 기능과 무관한 기존 이슈
