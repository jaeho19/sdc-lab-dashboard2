# SDC Lab 연구실 관리 대시보드

## 프로젝트 개요

서울시립대학교 SDC Lab(Spatial Data & Community Lab) 연구실의 연구 진행 현황, 일정, 멘토링 기록을 통합 관리하는 웹 기반 대시보드

### 핵심 요구사항
- 연구원별 연구 진행률 실시간 추적
- 공용/개인 캘린더 통합 관리
- 멘토링 기록 및 파일 공유
- 역할 기반 접근 권한 제어
- 연구 흐름도(MD 파일) 업로드 및 열람

### 사용자 규모
- 풀타임 연구원 8명
- 파트타임 연구원 4명
- 관리자 1명 (이재호 교수)

---

## 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | Next.js 14 + TypeScript |
| UI Framework | Tailwind CSS + shadcn/ui |
| State Management | Zustand + React Query |
| Backend/DB | Supabase (500MB DB, 1GB Storage, 50K MAU) |
| Hosting | Vercel (100GB 대역폭/월) |
| MD Rendering | react-markdown + remark-gfm |

---

## 개발 규칙

### 코드 스타일
- TypeScript strict mode 사용
- 컴포넌트는 함수형으로 작성
- API 호출은 React Query 사용
- 스타일은 Tailwind CSS 유틸리티 클래스 사용
- shadcn/ui 컴포넌트 우선 활용

### 파일 구조
```
src/
├── app/                 # Next.js App Router
├── components/          # 재사용 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   └── features/       # 기능별 컴포넌트
├── lib/                # 유틸리티, Supabase 클라이언트
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
└── types/              # TypeScript 타입 정의
```

### 네이밍 컨벤션
- 컴포넌트: PascalCase (MemberCard.tsx)
- 훅: camelCase with use prefix (useMemberList.ts)
- 유틸리티: camelCase (formatDate.ts)
- 타입: PascalCase with 접미사 (MemberType, ProjectStatus)

---

## 참고 스킬

프로젝트 전용 스킬이 `.claude/skills/`에 있습니다:

| 스킬 | 용도 |
|------|------|
| supabase-automation | Supabase 설정, RLS, 스키마 |
| auth-implementation-patterns | 인증/로그인 구현 |
| frontend-design | UI 구현 |
| ui-designer | 컴포넌트 설계 |
| ux-designer | UX 흐름 설계 |
| theme-factory | 테마/스타일링 |
| superpowers | TDD, 코드리뷰, Git 워크플로우 |

---

## 데이터베이스 스키마

### 주요 테이블
- `members`: 연구원 정보 (status: pending/active/graduated/leave)
- `research_projects`: 연구 프로젝트
- `project_members`: 프로젝트-연구원 매핑
- `milestones`: 연구 단계별 진행
- `checklist_items`: 체크리스트 항목
- `calendar_events`: 일정
- `member_courses`: 수강 교과목
- `mentoring_posts`: 멘토링 기록
- `mentoring_comments`: 멘토링 댓글
- `mentoring_likes`: 좋아요
- `files`: 첨부파일
- `notifications`: 알림 (마감일, 댓글, 좋아요, 프로젝트 업데이트)

### 진행률 자동 계산
```
overall_progress = Σ (milestone_weight × (completed_checklist / total_checklist))
```

### ERD 개요
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

---

## 화면 구성

### 사이드바 메뉴 (좌측 240px)
1. Dashboard - 요약 통계
2. Members - 연구원 목록
3. Research Articles - 연구 프로젝트
4. Calendar - 일정 관리
5. Mentoring - 멘토링 기록

### 주요 화면
1. **Dashboard**: 요약 통계 카드, 이번 주 일정, 진행 중 연구 현황
2. **Members**: 연구원 카드 그리드, 상세 정보, 개인 캘린더
3. **Research Articles**: 프로젝트 목록, 상세(마일스톤, 체크리스트, MD 흐름도)
4. **Calendar**: 월간 뷰, 카테고리 필터, 이벤트 CRUD
5. **Mentoring**: 게시물 목록, 상세, 댓글, 좋아요

---

## 구현 우선순위

### P0 (필수)
- 사용자 인증 (이메일 기반, 자가 가입 + 관리자 승인)
- Dashboard
- Members 목록/상세
- Research Articles CRUD (진행률 자동 계산)
- Calendar
- Mentoring CRUD
- 파일 업로드/다운로드
- 알림 (마감일 D-7/D-3/D-1, 댓글, 좋아요, 프로젝트 업데이트)

### P1 (추가)
- 대시보드 요약 통계
- 프로젝트 타임라인 (간트 차트)
- 검색 기능
- 다크 모드
- 연구 흐름도 MD 렌더링

---

## 권한 시스템

| 역할 | 조건 | 권한 |
|------|------|------|
| 관리자 | `position = 'professor'` | 모든 CRUD, 사용자 승인, 타인 글 삭제 |
| 일반 연구원 | 그 외 | 본인 데이터 CRUD, 타인 데이터 읽기 |

---

## 보안 고려사항

1. Supabase Auth 이메일 인증 + 관리자 승인
2. 허용 확장자: .pdf, .docx, .xlsx, .pptx, .png, .jpg, .md
3. 파일 크기: 단일 파일 10MB 제한
4. XSS 방지: sanitization
5. RLS: 역할 기반 데이터 접근 제어

---

## UI 디자인

| 항목 | 값 |
|------|------|
| 사이드바 배경 | `#1e293b` (다크 네이비) |
| 메인 배경 | `#ffffff` |
| 활성/성공 | `#10b981` (에메랄드) |
| 위험 | `#f43f5e` (로즈) |
| 폰트 | Pretendard (한글) + Inter (영문) |

Position 뱃지 색상: POST-DOC `#f59e0b`, PHD `#3b82f6`, RESEARCHER `#8b5cf6`, MS `#14b8a6`

---

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint
```

---

## 상세 명세서

전체 명세서는 `docs/SPECIFICATION.md` 참고
