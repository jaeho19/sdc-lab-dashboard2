# Plan: 관리자 활동 알림 시스템 (Admin Activity Notifications)

> 학생/연구원의 주요 활동(연구노트 작성, 멘토링 기록, 캘린더 이벤트 등)을 이재호 관리자(교수)에게 자동 알림으로 전달하는 기능

## 1. 배경 및 목적

### 문제 정의
- 현재 알림 시스템은 **마감일 알림(deadline)**과 **프로젝트 업데이트** 위주로만 동작
- 학생/연구원이 연구노트를 작성하거나, 멘토링 기록을 올리거나, 캘린더에 일정을 추가해도 교수(관리자)에게 별도 알림이 가지 않음
- 교수가 일일이 각 페이지를 방문하여 확인해야 하므로 학생 활동 파악에 시간이 소요됨

### 해결 목표
- 학생/연구원이 콘텐츠를 **생성/수정/삭제**하면 이재호 교수 계정에 자동 알림 생성
- 기존 `/notifications` 페이지에서 모든 활동 알림을 한 곳에서 확인 가능
- 알림 클릭 시 해당 콘텐츠로 바로 이동

## 2. 기능 요구사항

### 2.1 추적 대상 활동

| 활동 | 서버 액션 | 알림 내용 | 링크 |
|------|-----------|-----------|------|
| 연구노트 생성 | `createResearchNote` | "{이름}님이 연구노트를 작성했습니다: {제목}" | `/research-notes` |
| 연구노트 수정 | `updateResearchNote` | "{이름}님이 연구노트를 수정했습니다: {제목}" | `/research-notes` |
| 멘토링 기록 생성 | `createMentoringPost` | "{이름}님이 멘토링 기록을 올렸습니다" | `/mentoring/{id}` |
| 멘토링 기록 수정 | `updateMentoringPost` | "{이름}님이 멘토링 기록을 수정했습니다" | `/mentoring/{id}` |
| 캘린더 이벤트 생성 | `createCalendarEvent` | "{이름}님이 일정을 추가했습니다: {제목}" | `/calendar` |
| 캘린더 이벤트 수정 | `updateCalendarEvent` | "{이름}님이 일정을 수정했습니다: {제목}" | `/calendar` |
| 공지사항 생성 | `createAnnouncement` | "{이름}님이 공지를 등록했습니다: {제목}" | `/announcements/{id}` |
| 연구 프로젝트 변경 | `updateResearchProject` | "{이름}님이 프로젝트를 업데이트했습니다: {제목}" | `/research/{id}` |

### 2.2 알림 조건
- **발신자 제외**: 교수 본인의 활동은 본인에게 알림을 보내지 않음
- **대상**: position이 `professor`인 모든 멤버에게 알림 전송 (현재 이재호 교수 1명)
- **중복 방지**: 동일 entity에 대해 1분 이내 반복 수정 시 알림을 합치거나 스킵

### 2.3 알림 타입 확장
- 기존 `NotificationType`에 `admin_activity` 타입 추가
- 또는 기존 `project_update` 타입을 활용하여 메시지로 구분

## 3. 기술 범위

### 3.1 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/database.types.ts` | `NotificationType`에 새 타입 추가 |
| `src/types/database.ts` | 동일하게 타입 추가 |
| `src/lib/actions/notifications.ts` | 관리자 알림 생성 헬퍼 함수 추가 |
| `src/lib/actions/research-notes.ts` | create/update에 관리자 알림 호출 추가 |
| `src/lib/actions/mentoring.ts` | create/update에 관리자 알림 호출 추가 |
| `src/lib/actions/calendar.ts` | create/update에 관리자 알림 호출 추가 |
| `src/lib/actions/announcements.ts` | create에 관리자 알림 호출 추가 |
| `src/lib/actions/research.ts` | update에 관리자 알림 호출 추가 |
| Supabase DB | notifications 테이블의 type enum에 새 값 추가 (필요 시) |

### 3.2 핵심 헬퍼 함수

```typescript
// notifications.ts에 추가할 함수
async function notifyAdmins(params: {
  actorId: string;       // 활동한 멤버 ID
  actorName: string;     // 활동한 멤버 이름
  action: string;        // "created" | "updated" | "deleted"
  entityType: string;    // "research_note" | "mentoring_post" | "calendar_event" 등
  entityTitle: string;   // 콘텐츠 제목
  link: string;          // 알림 클릭 시 이동할 경로
})
```

### 3.3 구현 방식
- **서버 액션 레벨에서 직접 호출**: 각 CRUD 서버 액션 끝에서 `notifyAdmins()` 호출
- DB 트리거나 Supabase Edge Function 대신 **Application 레벨**에서 처리 (가장 간단하고 유지보수 용이)
- 알림 생성 실패 시 원래 작업에는 영향을 주지 않도록 try-catch로 감싸기

## 4. 구현 우선순위

| 우선순위 | 항목 | 설명 |
|---------|------|------|
| P0 | 연구노트 생성/수정 알림 | 가장 핵심적인 학생 활동 |
| P0 | 멘토링 기록 생성/수정 알림 | 교수 확인이 필요한 활동 |
| P1 | 캘린더 이벤트 생성/수정 알림 | 일정 변경 추적 |
| P1 | 연구 프로젝트 변경 알림 | 프로젝트 상태 추적 |
| P2 | 공지사항 생성 알림 | (교수가 주로 작성하므로 낮은 우선순위) |

## 5. 비기능 요구사항

- **성능**: 알림 생성은 비동기로 처리, 원본 작업의 응답 시간에 영향 최소화
- **안정성**: 알림 생성 실패 시에도 원본 CRUD 동작은 정상 수행
- **확장성**: 향후 교수 외 다른 역할에도 알림 확장 가능한 구조
- **DB 마이그레이션**: notification_type enum에 새 값을 추가해야 하므로 Supabase SQL 마이그레이션 필요

## 6. 제약사항 및 리스크

| 리스크 | 대응 |
|--------|------|
| 알림 과다 (스팸화) | 중복 방지 로직 + 향후 알림 설정 기능 고려 |
| notification_type enum 변경 | Supabase Dashboard에서 직접 ALTER TYPE 실행 필요 |
| 교수 member ID 하드코딩 위험 | position="professor" 조건으로 동적 조회 |

## 7. 완료 기준

- [ ] 학생이 연구노트 작성 시 교수 알림 페이지에 알림 표시
- [ ] 학생이 멘토링 기록 등록 시 교수 알림 페이지에 알림 표시
- [ ] 캘린더/프로젝트 변경 시 교수 알림 표시
- [ ] 알림 클릭 시 해당 콘텐츠로 이동
- [ ] 교수 본인 활동은 알림 미생성
- [ ] 알림 생성 실패 시 원본 기능 영향 없음
