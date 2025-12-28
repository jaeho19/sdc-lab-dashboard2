## 1. 프로젝트 개요

### 1.1 목적

서울시립대학교 SDC Lab(Spatial Data & Community Lab) 연구실의 연구 진행 현황, 일정, 멘토링 기록을 통합 관리하는 웹 기반 대시보드 구축

### 1.2 핵심 요구사항

- 연구원별 연구 진행률 실시간 추적
- 공용/개인 캘린더 통합 관리
- 멘토링 기록 및 파일 공유
- 역할 기반 접근 권한 제어
- **연구 흐름도(MD 파일) 업로드 및 열람**

### 1.3 사용자 규모

- 풀타임 연구원 8명: 김은솔, 이지윤, 강성익, 오재인, 최희진, 이다연, 배성훈, 이은진
- 파트타임 연구원 4명: 권기덕, 지인섭, 황지윤, 최지혜
- 관리자 1명: 이재호 교수

---

## 2. 시스템 아키텍처

### 2.1 기술 스택 (무료 티어 최적화)

|계층|기술|무료 티어 한도|
|---|---|---|
|Frontend|Next.js 14 + TypeScript|-|
|UI Framework|Tailwind CSS + shadcn/ui|-|
|State Management|Zustand + React Query|-|
|Backend/DB|Supabase|500MB DB, 1GB Storage, 50K MAU|
|Hosting|Vercel|100GB 대역폭/월|
|MD Rendering|react-markdown + remark-gfm|-|

### 2.2 무료 운영 가능 근거

- 사용자 12명 × 월 100회 접속 = 1,200 MAU (한도 50K의 2.4%)
- 예상 DB 사용량: ~50MB (한도 500MB의 10%)
- 예상 Storage: ~200MB (한도 1GB의 20%)


---

## 3. 데이터베이스 스키마 설계

### 3.1 ERD 개요

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   members   │────<│ research_projects│>────│  milestones  │
└─────────────┘     └─────────────────┘     └──────────────┘
       │                    │                      │
       ├──────────────┐     │                      ▼
       │              │     │              ┌──────────────┐
       ▼              ▼     ▼              │checklist_items│
┌──────────────┐ ┌──────────────┐          └──────────────┘
│calendar_events│ │member_courses│
└──────────────┘ └──────────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│ mentoring_posts │────<│mentoring_comments│     │mentoring_likes│
└─────────────────┘     └──────────────────┘     └───────────────┘
       │
       ▼
┌─────────────┐     ┌───────────────┐
│    files    │     │ notifications │
└─────────────┘     └───────────────┘
```

### 3.2 테이블 정의

#### members (연구원 정보)

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  profile_image_url TEXT,
  position VARCHAR(20) NOT NULL CHECK (position IN ('professor', 'post_doc', 'phd', 'researcher', 'ms')),
  employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time')),
  enrollment_year INT,
  expected_graduation_year INT,
  is_completed BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'graduated', 'leave')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### research_projects (연구 프로젝트)

```sql
CREATE TABLE research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('thesis', 'submission', 'revision', 'individual', 'grant')),
  tag VARCHAR(50),
  target_journal VARCHAR(200),
  target_submission_date DATE,
  target_publication_date DATE,
  status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing', 'submitting', 'under_review', 'revision', 'accepted', 'published')),
  overall_progress INT DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  flowchart_md_path TEXT,
  flowchart_md_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```


#### project_members (프로젝트-연구원 매핑)

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('first_author', 'corresponding', 'co_author')),
  responsibilities TEXT,
  UNIQUE(project_id, member_id)
);
```

#### milestones (연구 단계별 진행)

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
  stage VARCHAR(30) NOT NULL CHECK (stage IN (
    'literature_review', 'methodology', 'data_collection', 'analysis',
    'draft_writing', 'submission', 'review_revision', 'publication'
  )),
  weight INT DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  is_current BOOLEAN DEFAULT FALSE,
  completed_at DATE,
  notes TEXT,
  sort_order INT,
  UNIQUE(project_id, stage)
);
```

#### checklist_items (체크리스트 항목)

```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INT
);
```

#### calendar_events (일정)

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  category VARCHAR(20) NOT NULL CHECK (category IN (
    'lab_meeting', 'conference', 'social', 'deadline',
    'seminar', 'study', 'field_trip', 'vacation'
  )),
  is_shared BOOLEAN DEFAULT TRUE,
  member_id UUID REFERENCES members(id),
  project_id UUID REFERENCES research_projects(id),
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```


#### mentoring_posts (멘토링 기록)

```sql
CREATE TABLE mentoring_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  meeting_date DATE,
  professor_comments TEXT,
  next_steps TEXT[],
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### mentoring_comments (멘토링 댓글)

```sql
CREATE TABLE mentoring_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES mentoring_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### files (첨부파일)

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES members(id),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('project', 'mentoring_post', 'flowchart')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### member_courses (수강 교과목)

```sql
CREATE TABLE member_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  course_name VARCHAR(200) NOT NULL,
  semester VARCHAR(20), -- '2025-1', '2025-2'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### mentoring_likes (좋아요)

```sql
CREATE TABLE mentoring_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES mentoring_posts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, member_id)
);
```

#### notifications (알림)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'deadline_reminder', 'mentoring_comment', 'mentoring_like', 'project_update'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  entity_type VARCHAR(20), -- 'calendar_event', 'mentoring_post', 'project'
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 진행률 자동 계산

프로젝트의 `overall_progress`는 다음 공식으로 자동 계산됩니다:

```
overall_progress = Σ (milestone_weight × (completed_checklist / total_checklist))
```

**계산 예시:**
| 단계 | 가중치 | 체크리스트 완료 | 기여도 |
|------|--------|----------------|--------|
| 문헌조사 | 10% | 4/4 (100%) | 10 |
| 방법론 설계 | 15% | 3/5 (60%) | 9 |
| 데이터 수집 | 14% | 4/4 (100%) | 14 |
| 분석 | 20% | 1/4 (25%) | 5 |
| 나머지 단계 | - | 0% | 0 |

**Overall = 10 + 9 + 14 + 5 = 38%**

### 3.4 권한 시스템

#### 역할 정의
| 역할 | 조건 | 권한 |
|------|------|------|
| 관리자 | `position = 'professor'` | 모든 데이터 CRUD, 사용자 승인/관리, 타인 글 삭제 |
| 일반 연구원 | `position != 'professor'` | 본인 데이터 CRUD, 타인 데이터 읽기 |

#### 데이터별 접근 권한
| 데이터 | 읽기 | 생성 | 수정 | 삭제 |
|--------|------|------|------|------|
| 연구원 일정 | 모든 연구원 | 본인만 | 본인만 | 본인만 |
| 멘토링 포스트 | 모든 연구원 | 모든 연구원 | 본인만 | 본인 + 관리자 |
| 멘토링 댓글 | 모든 연구원 | 모든 연구원 | 본인만 | 본인 + 관리자 |
| 프로젝트 | 모든 연구원 | 모든 연구원 | 모든 연구원 | 관리자만 |
| 회원 승인 | - | - | 관리자만 | - |

### 3.5 사용자 가입 프로세스

1. 연구원이 회원가입 페이지에서 이메일/비밀번호 입력
2. 계정 생성 → `members.status = 'pending'`
3. 관리자(이재호)가 관리 페이지에서 승인
4. 승인 후 `status = 'active'`로 변경, 로그인 가능

---

## 4. 구현 기능 명세

### 4.1 필수 구현 (P0)

|기능|설명|
|---|---|
|사용자 인증|이메일 기반 로그인/로그아웃, 자가 가입 + 관리자 승인|
|Dashboard|요약 통계, 일정, 연구 현황|
|Members 목록/상세|연구원 카드, 상세 정보|
|Research Articles|프로젝트 CRUD, 체크리스트, 진행률 자동 계산|
|Calendar|공용/개인 캘린더, 카테고리 필터|
|Mentoring|게시물 CRUD, 댓글, 좋아요|
|파일 업로드/다운로드|첨부파일 관리|
|알림|마감일 알림(D-7,D-3,D-1), 댓글/좋아요/프로젝트 업데이트 알림|

### 4.2 추가 구현 (P1)

|기능|설명|
|---|---|
|대시보드 요약 통계|전체 프로젝트 수, 진행률|
|프로젝트 타임라인|간트 차트 형태|
|검색 기능|Supabase Full-text search|
|다크 모드|next-themes + Tailwind|
|연구 흐름도 MD|react-markdown 렌더링|


---

## 5. 초기 데이터

### 연구원 초기 데이터

```sql
-- 관리자 (교수)
INSERT INTO members (name, email, position, employment_type) VALUES
('이재호', 'jaeho@uos.ac.kr', 'professor', 'full_time');

-- 풀타임 연구원
INSERT INTO members (name, email, position, employment_type) VALUES
('강성익', 'kang@uos.ac.kr', 'post_doc', 'full_time'),
('오재인', 'oh@uos.ac.kr', 'post_doc', 'full_time'),
('김은솔', 'kim@uos.ac.kr', 'phd', 'full_time'),
('이지윤', 'lee_jy@uos.ac.kr', 'phd', 'full_time'),
('이다연', 'lee_dy@uos.ac.kr', 'researcher', 'full_time'),
('최희진', 'choi@uos.ac.kr', 'ms', 'full_time'),
('배성훈', 'bae@uos.ac.kr', 'ms', 'full_time'),
('이은진', 'lee_ej@uos.ac.kr', 'ms', 'full_time');

-- 파트타임 연구원
INSERT INTO members (name, email, position, employment_type) VALUES
('권기덕', 'kwon@uos.ac.kr', 'researcher', 'part_time'),
('지인섭', 'ji@uos.ac.kr', 'researcher', 'part_time'),
('황지윤', 'hwang@uos.ac.kr', 'researcher', 'part_time'),
('최지혜', 'choi_jh@uos.ac.kr', 'researcher', 'part_time');
```

---

## 6. 보안 고려사항

1. **인증**: Supabase Auth 이메일 인증
2. **파일 업로드**: 허용 확장자 (.pdf, .docx, .xlsx, .pptx, .png, .jpg, .md)
3. **파일 크기**: 단일 파일 10MB 제한
4. **XSS 방지**: 멘토링/MD 입력 시 sanitization
5. **RLS**: 역할 기반 데이터 접근 제어

---

## 7. 개발 일정 (예상)

|단계|기간|산출물|
|---|---|---|
|1. 환경 구축|1주|Supabase 설정, Next.js 초기화|
|2. DB 스키마|1주|테이블 생성, RLS|
|3. Dashboard|1주|요약 통계, 일정 미리보기|
|4. Members|1주|목록, 상세, 개인 캘린더|
|5. Research Articles|2주|CRUD, 체크리스트, MD 흐름도|
|6. Calendar|1주|월간 뷰, 카테고리 필터|
|7. Mentoring|1주|게시물, 댓글, 좋아요|
|8. 검색/다크모드|0.5주|통합 검색, 테마 전환|
|9. 테스트/배포|0.5주|QA, Vercel 배포|

**총 예상 기간: 10주**

---

## 8. 비용 (무료 운영)

|항목|비용|
|---|---|
|Supabase Free Tier|$0|
|Vercel Hobby|$0|
|도메인|$0|

**총 월 운영 비용: $0**

---

## 9. UI/UX 요구사항

### 9.1 디자인 컨셉

**세련되고 깔끔한 미니멀 디자인**
- 모바일 반응형 필수 (Tailwind CSS 반응형 클래스 활용)
- 사이드바: 좌측 고정 240px

### 9.2 색상 팔레트

| 용도 | 색상 | Hex |
|------|------|-----|
| 사이드바 배경 | 다크 네이비 | `#1e293b` |
| 메인 배경 | 화이트 | `#ffffff` |
| 카드 배경 | 라이트 그레이 | `#f8fafc` |
| 활성 메뉴/성공 | 에메랄드 | `#10b981` |
| 위험/로그아웃 | 로즈 | `#f43f5e` |
| POST-DOC 뱃지 | 앰버 | `#f59e0b` |
| PHD 뱃지 | 블루 | `#3b82f6` |
| RESEARCHER 뱃지 | 바이올렛 | `#8b5cf6` |
| MS 뱃지 | 티얼 | `#14b8a6` |
| 텍스트 (주) | 슬레이트 | `#334155` |
| 텍스트 (부) | 그레이 | `#64748b` |
| 보더 | 라이트 그레이 | `#e2e8f0` |

### 9.3 폰트

- **한글**: Pretendard
- **영문**: Inter
- 현대적이고 가독성 높은 폰트 조합

### 9.4 알림 구현

| 알림 유형 | 방식 | 트리거 |
|----------|------|--------|
| 마감일 알림 | 브라우저 푸시 + 앱 내 알림 | D-7, D-3, D-1 |
| 멘토링 댓글 | 앱 내 알림 | 내 게시물에 댓글 작성 시 |
| 좋아요 | 앱 내 알림 | 내 게시물에 좋아요 시 |
| 프로젝트 업데이트 | 앱 내 알림 | 내가 참여한 프로젝트 변경 시 |

**기술 스택**: Supabase Realtime + 브라우저 Notification API
