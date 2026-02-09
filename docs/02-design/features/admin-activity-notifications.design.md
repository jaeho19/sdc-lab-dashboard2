# Design: 관리자 활동 알림 시스템 (Admin Activity Notifications)

> Plan 문서: `docs/01-plan/features/admin-activity-notifications.plan.md`

## 1. 설계 개요

학생/연구원의 콘텐츠 활동(생성/수정)을 교수(position="professor") 계정에 알림으로 전달한다.
기존 `notifications` 테이블과 `/notifications` UI를 그대로 활용하며, 새로운 헬퍼 함수 `notifyAdmins()`를 만들어 각 서버 액션에서 호출한다.

## 2. 알림 타입 전략

### 선택: 기존 `"project_update"` 타입 재활용

| 방식 | 장점 | 단점 |
|------|------|------|
| **새 타입 `"activity"` 추가** | 아이콘/필터 구분 가능 | DB enum ALTER 필요, 타입 파일 2곳 수정 |
| **`"project_update"` 재활용** | DB 변경 없음, 즉시 동작 | 아이콘이 동일 |

**결정**: `"project_update"` 타입 재활용
- DB 마이그레이션 없이 즉시 배포 가능
- 알림 `title`과 `message` 내용으로 활동 종류 충분히 구분 가능
- 기존 UI의 `typeIcons`에 이미 `project_update` 아이콘(FileText, 초록색) 존재
- 향후 필요 시 새 타입으로 마이그레이션 가능

## 3. 핵심 함수 설계

### 3.1 `notifyAdmins()` 헬퍼 함수

**위치**: `src/lib/actions/notifications.ts`

```typescript
/**
 * 교수(관리자)에게 활동 알림을 보내는 헬퍼 함수
 * - actorId가 교수 본인이면 알림을 생성하지 않음
 * - 알림 생성 실패 시 에러를 로깅만 하고 throw하지 않음
 */
export async function notifyAdmins(params: {
  actorId: string;
  actorName: string;
  title: string;
  message: string;
  link: string;
}): Promise<void>
```

**내부 로직**:
```
1. supabase.from("members").select("id").eq("position", "professor")
2. 결과에서 actorId와 동일한 교수 제외 (필터)
3. 남은 교수들에게 notifications.insert() (bulk insert)
4. 전체를 try-catch로 감싸서 실패 시 console.error만 출력
```

**설계 결정 사항**:
- 교수 목록은 매번 DB에서 조회 (멤버 수가 적으므로 캐싱 불필요)
- 한 명의 교수만 있어도 bulk insert 패턴 사용 (향후 확장 대비)
- `link` 필드로 알림 클릭 시 해당 페이지로 이동 지원

### 3.2 각 서버 액션에 추가할 호출 코드

## 4. 수정 대상 파일 상세

### 4.1 `src/lib/actions/notifications.ts` — notifyAdmins 추가

**추가 위치**: 파일 끝 (기존 함수들 아래)

```typescript
// 관리자(교수)에게 활동 알림 전송
export async function notifyAdmins(params: {
  actorId: string;
  actorName: string;
  title: string;
  message: string;
  link: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // 교수 목록 조회
    const { data: professors } = await supabase
      .from("members")
      .select("id")
      .eq("position", "professor");

    if (!professors || professors.length === 0) return;

    // 활동한 본인이 교수면 해당 교수 제외
    const targets = professors.filter(
      (p: { id: string }) => p.id !== params.actorId
    );

    if (targets.length === 0) return;

    // 알림 bulk insert
    const notifications = targets.map((p: { id: string }) => ({
      member_id: p.id,
      type: "project_update" as const,
      title: params.title,
      message: params.message,
      link: params.link,
      is_read: false,
    }));

    await supabase.from("notifications").insert(notifications as never);
  } catch (error) {
    console.error("Admin notification error:", error);
  }
}
```

### 4.2 `src/lib/actions/research-notes.ts` — 연구노트 생성/수정

**createResearchNote** (line ~66, 성공 후 revalidatePath 전):
```typescript
// 관리자 알림 (성공 후)
const memberInfo = await supabase
  .from("members")
  .select("name")
  .eq("id", member.id)
  .single();
const memberName = (memberInfo.data as { name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId: member.id,
  actorName: memberName,
  title: "연구노트 작성",
  message: `${memberName}님이 연구노트를 작성했습니다: "${data.title}"`,
  link: `/research-notes`,
});
```

**updateResearchNote** (line ~128, 성공 후 revalidatePath 전):
```typescript
// 관리자 알림
const memberName = /* currentMember에서 name 조회 */ ;

notifyAdmins({
  actorId: currentMember.id,
  actorName: memberName,
  title: "연구노트 수정",
  message: `${memberName}님이 연구노트를 수정했습니다: "${data.title}"`,
  link: `/research-notes`,
});
```

> **참고**: updateResearchNote에서는 이미 `currentMember`를 조회하고 있으나 `name` 필드를 가져오지 않으므로, select에 `name`을 추가해야 함.

### 4.3 `src/lib/actions/mentoring.ts` — 멘토링 기록 생성/수정

**createMentoringPost** (line ~48, 성공 후 redirect 전):
```typescript
// 관리자 알림
const { data: actorMember } = await supabase
  .from("members")
  .select("name")
  .eq("id", user.id)
  .single();
const actorName = (actorMember as { name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId: user.id,
  actorName: actorName,
  title: "멘토링 기록 등록",
  message: `${actorName}님이 멘토링 기록을 등록했습니다 (${meetingDate})`,
  link: `/mentoring/${post.id}`,
});
```

**updateMentoringPost** (line ~96, 성공 후 redirect 전):
```typescript
// 관리자 알림
const { data: actorMember } = await supabase
  .from("members")
  .select("name")
  .eq("id", user.id)
  .single();
const actorName = (actorMember as { name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId: user.id,
  actorName: actorName,
  title: "멘토링 기록 수정",
  message: `${actorName}님이 멘토링 기록을 수정했습니다 (${meetingDate})`,
  link: `/mentoring/${postId}`,
});
```

> **주의**: `createMentoringPost`는 성공 시 `redirect()`를 호출하므로, `notifyAdmins()`는 redirect 전에 **fire-and-forget** 방식으로 호출해야 한다. `notifyAdmins()`는 내부적으로 try-catch를 가지므로 await 없이 호출해도 안전하다. 단, redirect가 throw되므로 notifyAdmins를 먼저 await하고 redirect를 마지막에 호출한다.

### 4.4 `src/lib/actions/calendar.ts` — 캘린더 이벤트 생성/수정

**createCalendarEvent** (line ~59, 성공 후 revalidatePath 전):
```typescript
// 관리자 알림
const { data: actorMember } = await supabase
  .from("members")
  .select("name")
  .eq("id", memberId)
  .single();
const actorName = (actorMember as { name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId: memberId || "",
  actorName: actorName,
  title: "캘린더 일정 추가",
  message: `${actorName}님이 일정을 추가했습니다: "${input.title}"`,
  link: `/calendar`,
});
```

**updateCalendarEvent** (line ~104, 성공 후 revalidatePath 전):
```typescript
// 관리자 알림 — actor 정보 조회를 위해 members 쿼리 필요
const { data: actorMember } = await supabase
  .from("members")
  .select("id, name")
  .eq("user_id", user.id)  // 또는 email 기반
  .single();
const actorId = (actorMember as { id: string; name: string } | null)?.id || "";
const actorName = (actorMember as { id: string; name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId,
  actorName,
  title: "캘린더 일정 수정",
  message: `${actorName}님이 일정을 수정했습니다: "${input.title || ""}"`,
  link: `/calendar`,
});
```

### 4.5 `src/lib/actions/research.ts` — 프로젝트 생성

**createProject** (line ~76, 프로젝트 생성 성공 후):
```typescript
// 관리자 알림
const { data: actorMember } = await supabase
  .from("members")
  .select("name")
  .eq("id", memberData.id)
  .single();
const actorName = (actorMember as { name: string } | null)?.name || "멤버";

notifyAdmins({
  actorId: memberData.id,
  actorName: actorName,
  title: "연구 프로젝트 생성",
  message: `${actorName}님이 새 연구 프로젝트를 생성했습니다: "${formData.title}"`,
  link: `/research/${projectData.id}`,
});
```

> **참고**: `updateProject`는 이미 프로젝트 멤버들에게 알림을 보내고 있으므로, 교수가 프로젝트 멤버인 경우 기존 알림으로 충분하다. 교수가 멤버가 아닌 프로젝트의 변경사항도 알림을 받고 싶다면 여기에도 `notifyAdmins()`를 추가한다.

## 5. 알림 메시지 정의

| 서버 액션 | title | message | link |
|-----------|-------|---------|------|
| createResearchNote | "연구노트 작성" | "{이름}님이 연구노트를 작성했습니다: \"{제목}\"" | `/research-notes` |
| updateResearchNote | "연구노트 수정" | "{이름}님이 연구노트를 수정했습니다: \"{제목}\"" | `/research-notes` |
| createMentoringPost | "멘토링 기록 등록" | "{이름}님이 멘토링 기록을 등록했습니다 ({날짜})" | `/mentoring/{id}` |
| updateMentoringPost | "멘토링 기록 수정" | "{이름}님이 멘토링 기록을 수정했습니다 ({날짜})" | `/mentoring/{id}` |
| createCalendarEvent | "캘린더 일정 추가" | "{이름}님이 일정을 추가했습니다: \"{제목}\"" | `/calendar` |
| updateCalendarEvent | "캘린더 일정 수정" | "{이름}님이 일정을 수정했습니다: \"{제목}\"" | `/calendar` |
| createProject | "연구 프로젝트 생성" | "{이름}님이 새 연구 프로젝트를 생성했습니다: \"{제목}\"" | `/research/{id}` |
| updateProject | "연구 프로젝트 수정" | "{이름}님이 프로젝트를 수정했습니다: \"{제목}\"" | `/research/{id}` |

## 6. 구현 순서

```
Step 1: notifications.ts에 notifyAdmins() 함수 추가
   ↓
Step 2: research-notes.ts — createResearchNote, updateResearchNote 수정
   ↓  (updateResearchNote의 members select에 name 추가 필요)
Step 3: mentoring.ts — createMentoringPost, updateMentoringPost 수정
   ↓  (redirect 전에 notifyAdmins await 필요)
Step 4: calendar.ts — createCalendarEvent, updateCalendarEvent 수정
   ↓
Step 5: research.ts — createProject 수정
   ↓
Step 6: notification-list.tsx UI 확인 (기존 "project_update" 아이콘 적용됨, 변경 불필요)
```

## 7. 주의사항

### 7.1 redirect와 notifyAdmins 순서
- Next.js의 `redirect()`는 내부적으로 throw하여 흐름을 중단시킴
- 따라서 `notifyAdmins()`를 반드시 `redirect()` **이전에** await해야 함
- mentoring.ts의 `createMentoringPost`, `updateMentoringPost`에 해당

### 7.2 멤버 이름 조회
- 일부 서버 액션은 이미 멤버 정보를 조회하지만 `name` 필드를 포함하지 않음
- 추가 쿼리 또는 기존 select에 `name` 필드 추가 필요
- 성능 영향 최소화: members 테이블 조회는 PK 기반이므로 매우 빠름

### 7.3 에러 격리
- `notifyAdmins()` 내부 전체가 try-catch로 감싸져 있으므로, 알림 생성 실패가 원본 CRUD에 영향을 주지 않음
- console.error로 로깅하여 디버깅 가능

### 7.4 타입 안전성
- 기존 코드 패턴을 따라 `as never` 캐스팅 사용 (Supabase 타입 불일치 우회)
- `notifyAdmins()`의 파라미터는 명시적 인터페이스로 정의

## 8. UI 영향 분석

### 변경 불필요한 파일
- `src/components/features/notifications/notification-list.tsx`: `"project_update"` 타입에 대한 아이콘(FileText, 초록색)이 이미 매핑되어 있음
- `src/app/(dashboard)/notifications/page.tsx`: 기존 알림 조회 로직 그대로 사용
- 사이드바 알림 뱃지: 기존 `getUnreadNotificationCount()` 그대로 동작

### 기존 알림 흐름 영향 없음
- 기존 deadline, comment, like, research_note_comment 알림은 그대로 동작
- 새로운 알림은 기존 알림과 함께 시간순 정렬로 표시

## 9. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|-----------|
| 1 | 학생이 연구노트 작성 | 교수 알림 페이지에 "연구노트 작성" 알림 표시 |
| 2 | 학생이 연구노트 수정 | 교수 알림에 "연구노트 수정" 알림 표시 |
| 3 | 학생이 멘토링 기록 등록 | 교수 알림에 "멘토링 기록 등록" 알림 표시 |
| 4 | 학생이 캘린더 일정 추가 | 교수 알림에 "캘린더 일정 추가" 알림 표시 |
| 5 | 학생이 프로젝트 생성 | 교수 알림에 "연구 프로젝트 생성" 알림 표시 |
| 6 | **교수 본인**이 연구노트 작성 | 교수에게 알림 **미생성** |
| 7 | 알림 클릭 시 | 해당 콘텐츠 페이지로 이동 |
| 8 | 알림 생성 실패 시 | 원본 CRUD 작업은 정상 완료 |
| 9 | 알림 "읽음" 처리 | 기존 기능 그대로 동작 |
