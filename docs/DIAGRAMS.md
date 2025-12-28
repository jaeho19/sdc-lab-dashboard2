# SDC Lab Dashboard - 시스템 다이어그램

## 1. 시스템 아키텍처 개요

```mermaid
graph TB
    subgraph Browser["Browser"]
        direction TB
        UI["Next.js App<br/>(React + TypeScript)"]
        RQ["React Query<br/>(Server State)"]
        ZS["Zustand<br/>(Client State)"]
        SW["Service Worker<br/>(Push Notifications)"]
    end

    subgraph Vercel["Vercel"]
        direction TB
        EDGE["Edge Runtime"]
        SSR["Server Components"]
        API["API Routes"]
        MW["Middleware<br/>(Auth Check)"]
    end

    subgraph Supabase["Supabase"]
        direction TB
        AUTH["Auth Service"]
        PG[("PostgreSQL<br/>+ RLS")]
        RT["Realtime<br/>(WebSocket)"]
        ST["Storage<br/>(Files)"]
        EF["Edge Functions<br/>(Cron Jobs)"]
    end

    UI <--> RQ
    UI <--> ZS
    UI <--> SW

    RQ <--> API
    SSR <--> PG

    API --> MW
    MW --> AUTH
    AUTH <--> PG

    API <--> PG
    API <--> ST

    RT -.->|"Realtime Events"| UI
    EF -->|"Scheduled Tasks"| PG

    style Browser fill:#e0f2fe
    style Vercel fill:#fef3c7
    style Supabase fill:#d1fae5
```

---

## 2. 데이터 흐름도

### 2.1 인증 흐름

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as Next.js App
    participant MW as Middleware
    participant SB as Supabase Auth
    participant DB as PostgreSQL

    rect rgb(230, 245, 255)
        Note over U,DB: 회원가입 플로우
        U->>UI: 이메일/비밀번호 입력
        UI->>SB: signUp()
        SB->>SB: 이메일 확인 메일 발송
        SB-->>UI: User 객체 반환
        UI->>DB: INSERT INTO members (status='pending')
        UI-->>U: "승인 대기 중" 페이지로 이동
    end

    rect rgb(255, 245, 230)
        Note over U,DB: 관리자 승인 플로우
        U->>UI: 관리자 로그인
        UI->>DB: SELECT * FROM members WHERE status='pending'
        DB-->>UI: 대기 중인 회원 목록
        U->>UI: 승인 버튼 클릭
        UI->>DB: UPDATE members SET status='active'
    end

    rect rgb(230, 255, 230)
        Note over U,DB: 로그인 플로우
        U->>UI: 이메일/비밀번호 입력
        UI->>SB: signInWithPassword()
        SB-->>UI: Session 반환
        UI->>MW: 보호된 페이지 접근
        MW->>SB: getSession()
        MW->>DB: SELECT status FROM members
        alt status = 'pending'
            MW-->>UI: Redirect to /pending-approval
        else status = 'active'
            MW-->>UI: 페이지 접근 허용
        end
    end
```

### 2.2 데이터 조회 흐름

```mermaid
sequenceDiagram
    autonumber
    participant C as Component
    participant RQ as React Query
    participant API as API Route
    participant MW as Middleware
    participant DB as PostgreSQL

    C->>RQ: useProjects()

    alt Cache Hit
        RQ-->>C: 캐시된 데이터 반환
    else Cache Miss
        RQ->>API: GET /api/projects
        API->>MW: 인증 체크
        MW-->>API: User 정보
        API->>DB: SELECT * FROM research_projects
        Note over API,DB: RLS가 자동으로 권한 필터링
        DB-->>API: 프로젝트 목록
        API-->>RQ: Response
        RQ->>RQ: 캐시 저장
        RQ-->>C: 데이터 반환
    end
```

### 2.3 진행률 자동 계산 흐름

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as Checkbox
    participant API as API
    participant DB as PostgreSQL
    participant TG as Trigger
    participant RT as Realtime

    U->>UI: 체크리스트 항목 체크
    UI->>API: PATCH /api/checklist/:id
    API->>DB: UPDATE checklist_items SET is_completed=true

    activate TG
    Note over DB,TG: on_checklist_change 트리거 실행
    TG->>DB: 해당 milestone의 체크리스트 집계
    TG->>DB: 프로젝트의 전체 마일스톤 가중치 계산
    TG->>DB: UPDATE research_projects SET overall_progress=X
    deactivate TG

    DB-->>RT: 테이블 변경 이벤트
    RT-->>UI: Realtime 업데이트
    UI->>UI: 진행률 바 애니메이션
```

---

## 3. ER 다이어그램

```mermaid
erDiagram
    members ||--o{ research_projects : creates
    members ||--o{ project_members : participates
    members ||--o{ calendar_events : owns
    members ||--o{ member_courses : enrolls
    members ||--o{ mentoring_posts : writes
    members ||--o{ mentoring_comments : writes
    members ||--o{ mentoring_likes : gives
    members ||--o{ files : uploads
    members ||--o{ notifications : receives

    research_projects ||--o{ project_members : has
    research_projects ||--o{ milestones : contains
    research_projects ||--o{ calendar_events : links
    research_projects ||--o{ files : has

    milestones ||--o{ checklist_items : contains

    mentoring_posts ||--o{ mentoring_comments : has
    mentoring_posts ||--o{ mentoring_likes : receives
    mentoring_posts ||--o{ files : has

    members {
        uuid id PK
        uuid user_id FK
        string name
        string email UK
        string profile_image_url
        enum position
        enum employment_type
        int enrollment_year
        int expected_graduation_year
        boolean is_completed
        enum status
        timestamp created_at
        timestamp updated_at
    }

    research_projects {
        uuid id PK
        string title
        enum category
        string tag
        string target_journal
        date target_submission_date
        date target_publication_date
        enum status
        int overall_progress
        string flowchart_md_path
        text flowchart_md_content
        timestamp created_at
        timestamp updated_at
    }

    project_members {
        uuid id PK
        uuid project_id FK
        uuid member_id FK
        enum role
        text responsibilities
    }

    milestones {
        uuid id PK
        uuid project_id FK
        enum stage
        int weight
        boolean is_current
        date completed_at
        text notes
        int sort_order
    }

    checklist_items {
        uuid id PK
        uuid milestone_id FK
        string content
        boolean is_completed
        timestamp completed_at
        int sort_order
    }

    calendar_events {
        uuid id PK
        string title
        text description
        timestamp start_datetime
        timestamp end_datetime
        boolean is_all_day
        enum category
        boolean is_shared
        uuid member_id FK
        uuid project_id FK
        uuid created_by FK
        timestamp created_at
    }

    member_courses {
        uuid id PK
        uuid member_id FK
        string course_name
        string semester
        timestamp created_at
    }

    mentoring_posts {
        uuid id PK
        uuid author_id FK
        text content
        date meeting_date
        text professor_comments
        array next_steps
        int likes_count
        timestamp created_at
        timestamp updated_at
    }

    mentoring_comments {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        text content
        timestamp created_at
    }

    mentoring_likes {
        uuid id PK
        uuid post_id FK
        uuid member_id FK
        timestamp created_at
    }

    files {
        uuid id PK
        string filename
        string original_filename
        string file_path
        int file_size
        string mime_type
        uuid uploaded_by FK
        enum entity_type
        uuid entity_id
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid member_id FK
        enum type
        string title
        text message
        string entity_type
        uuid entity_id
        boolean is_read
        timestamp created_at
    }
```

---

## 4. 사용자 인터페이스 구조

### 4.1 페이지 구조

```mermaid
graph TD
    subgraph Public["Public Routes"]
        LOGIN["/login"]
        SIGNUP["/signup"]
        PENDING["/pending-approval"]
    end

    subgraph Dashboard["Dashboard Routes"]
        DASH["/dashboard"]

        subgraph Members["Members"]
            M_LIST["/members"]
            M_DETAIL["/members/:id"]
        end

        subgraph Research["Research"]
            R_LIST["/research"]
            R_NEW["/research/new"]
            R_DETAIL["/research/:id"]
            R_EDIT["/research/:id/edit"]
        end

        subgraph Calendar["Calendar"]
            CAL["/calendar"]
        end

        subgraph Mentoring["Mentoring"]
            MT_LIST["/mentoring"]
            MT_NEW["/mentoring/new"]
            MT_DETAIL["/mentoring/:id"]
        end
    end

    subgraph Admin["Admin Routes"]
        APPROVALS["/admin/approvals"]
    end

    LOGIN -->|"로그인 성공"| DASH
    SIGNUP -->|"가입 완료"| PENDING
    PENDING -->|"승인됨"| DASH

    DASH --> M_LIST
    DASH --> R_LIST
    DASH --> CAL
    DASH --> MT_LIST

    M_LIST --> M_DETAIL
    R_LIST --> R_NEW
    R_LIST --> R_DETAIL
    R_DETAIL --> R_EDIT
    MT_LIST --> MT_NEW
    MT_LIST --> MT_DETAIL

    style Public fill:#fee2e2
    style Dashboard fill:#e0f2fe
    style Admin fill:#fef3c7
```

### 4.2 레이아웃 구조

```mermaid
graph LR
    subgraph Layout["Dashboard Layout"]
        subgraph Sidebar["Sidebar (240px)"]
            LOGO["Logo"]
            NAV["Navigation Menu"]
            USER["User Info"]
            LOGOUT["Logout"]
        end

        subgraph Main["Main Content"]
            HEADER["Header<br/>(Search, Notifications, Profile)"]
            CONTENT["Page Content"]
        end
    end

    LOGO --> NAV
    NAV --> USER
    USER --> LOGOUT

    HEADER --> CONTENT

    style Sidebar fill:#1e293b,color:#fff
    style Main fill:#ffffff
```

---

## 5. 컴포넌트 계층 구조

```mermaid
graph TD
    subgraph App["App"]
        ROOT["RootLayout"]

        subgraph Providers["Providers"]
            QP["QueryClientProvider"]
            TP["ThemeProvider"]
            AP["AuthProvider"]
        end

        subgraph Layouts["Layouts"]
            DL["DashboardLayout"]
            AL["AuthLayout"]
        end

        subgraph Pages["Pages"]
            DP["DashboardPage"]
            MP["MembersPage"]
            RP["ResearchPage"]
            CP["CalendarPage"]
            MTP["MentoringPage"]
        end
    end

    ROOT --> Providers
    Providers --> Layouts
    Layouts --> Pages

    subgraph Components["Shared Components"]
        subgraph UI["UI (shadcn)"]
            BTN["Button"]
            CARD["Card"]
            DLG["Dialog"]
            INP["Input"]
            TBL["Table"]
        end

        subgraph Layout_Comp["Layout"]
            SB["Sidebar"]
            HD["Header"]
            NB["NotificationBell"]
        end

        subgraph Features["Features"]
            MC["MemberCard"]
            PC["ProjectCard"]
            ML["MilestoneList"]
            CV["CalendarView"]
            PD["PostDetail"]
        end
    end

    Pages --> Components
```

---

## 6. 알림 시스템 아키텍처

```mermaid
graph TB
    subgraph Triggers["알림 트리거"]
        T1["댓글 작성"]
        T2["좋아요"]
        T3["프로젝트 업데이트"]
        T4["마감일 접근<br/>(D-7, D-3, D-1)"]
    end

    subgraph Database["Database Layer"]
        TG1["comment_notify_trigger"]
        TG2["like_notify_trigger"]
        TG3["project_update_trigger"]
        EF["Edge Function<br/>(deadline_checker)"]
        NT[("notifications<br/>테이블")]
    end

    subgraph Realtime["Supabase Realtime"]
        CH["notifications channel"]
        WS["WebSocket"]
    end

    subgraph Client["Client Layer"]
        HOOK["useRealtimeNotifications"]
        STORE["notificationStore"]
        BADGE["알림 배지"]
        TOAST["Toast 알림"]
        PUSH["브라우저 푸시"]
    end

    T1 --> TG1
    T2 --> TG2
    T3 --> TG3
    T4 --> EF

    TG1 --> NT
    TG2 --> NT
    TG3 --> NT
    EF --> NT

    NT --> CH
    CH --> WS
    WS --> HOOK

    HOOK --> STORE
    STORE --> BADGE
    HOOK --> TOAST
    HOOK --> PUSH

    style Triggers fill:#fef3c7
    style Database fill:#d1fae5
    style Realtime fill:#e0f2fe
    style Client fill:#fce7f3
```

---

## 7. 파일 업로드 흐름

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as FileUpload Component
    participant API as API Route
    participant ST as Supabase Storage
    participant DB as PostgreSQL

    U->>UI: 파일 선택

    rect rgb(255, 240, 240)
        Note over UI: 클라이언트 검증
        UI->>UI: 확장자 검증 (.pdf, .docx, .xlsx, .pptx, .png, .jpg, .md)
        UI->>UI: 파일 크기 검증 (max 10MB)
    end

    alt 검증 실패
        UI-->>U: 에러 메시지 표시
    else 검증 성공
        UI->>UI: 업로드 진행률 표시 시작
        UI->>API: POST /api/upload (FormData)

        rect rgb(240, 255, 240)
            Note over API: 서버 검증
            API->>API: MIME 타입 재검증
            API->>API: 파일명 sanitize
        end

        API->>ST: upload(bucket, path, file)
        ST-->>API: 업로드 완료, URL 반환

        API->>DB: INSERT INTO files
        DB-->>API: file record

        API-->>UI: { fileId, url, filename }
        UI->>UI: 업로드 완료 표시
        UI-->>U: 파일 미리보기/링크 표시
    end
```

---

## 8. 상태 관리 흐름

```mermaid
graph TD
    subgraph Server_State["Server State (React Query)"]
        direction TB
        Q1["useMembers()"]
        Q2["useProjects()"]
        Q3["useCalendarEvents()"]
        Q4["useMentoringPosts()"]
        Q5["useNotifications()"]

        CACHE[("Query Cache")]

        Q1 --> CACHE
        Q2 --> CACHE
        Q3 --> CACHE
        Q4 --> CACHE
        Q5 --> CACHE
    end

    subgraph Client_State["Client State (Zustand)"]
        direction TB
        S1["authStore<br/>- user<br/>- isAdmin"]
        S2["uiStore<br/>- sidebarOpen<br/>- theme"]
        S3["notificationStore<br/>- unreadCount"]
    end

    subgraph Components["Components"]
        C1["MemberList"]
        C2["ProjectList"]
        C3["Calendar"]
        C4["PostList"]
        C5["NotificationBell"]
        C6["Sidebar"]
    end

    CACHE --> C1
    CACHE --> C2
    CACHE --> C3
    CACHE --> C4
    CACHE --> C5

    S1 --> C5
    S1 --> C6
    S2 --> C6
    S3 --> C5

    style Server_State fill:#e0f2fe
    style Client_State fill:#fef3c7
    style Components fill:#d1fae5
```

---

## 9. 배포 아키텍처

```mermaid
graph TB
    subgraph Development["개발 환경"]
        DEV["localhost:3000"]
        DEV_DB["Supabase Dev Project"]
    end

    subgraph Production["프로덕션 환경"]
        subgraph Vercel_Prod["Vercel"]
            EDGE_NET["Edge Network<br/>(Global CDN)"]
            FUNC["Serverless Functions"]
        end

        subgraph Supabase_Prod["Supabase"]
            AUTH_P["Auth"]
            DB_P[("PostgreSQL")]
            ST_P["Storage"]
            RT_P["Realtime"]
        end
    end

    subgraph Users["사용자"]
        ADMIN["관리자<br/>(이재호 교수)"]
        RESEARCHERS["연구원<br/>(12명)"]
    end

    DEV -->|"git push"| EDGE_NET
    DEV_DB -.->|"마이그레이션"| DB_P

    ADMIN --> EDGE_NET
    RESEARCHERS --> EDGE_NET

    EDGE_NET <--> FUNC
    FUNC <--> AUTH_P
    FUNC <--> DB_P
    FUNC <--> ST_P
    RT_P -.->|"WebSocket"| EDGE_NET

    style Development fill:#fef3c7
    style Vercel_Prod fill:#e0f2fe
    style Supabase_Prod fill:#d1fae5
```

---

## 10. 보안 레이어

```mermaid
graph TD
    subgraph Request["요청"]
        USER["User Request"]
    end

    subgraph Layer1["Layer 1: Edge/Middleware"]
        MW["Next.js Middleware"]
        MW_CHECK{"세션 존재?"}
        MW_STATUS{"status = 'active'?"}
        MW_ADMIN{"관리자 페이지?<br/>position = 'professor'?"}
    end

    subgraph Layer2["Layer 2: API Route"]
        API["API Handler"]
        API_AUTH["getUser() 재검증"]
        API_VALID["Zod 입력 검증"]
    end

    subgraph Layer3["Layer 3: Database"]
        RLS["Row Level Security"]
        RLS_READ["SELECT: status='active' 확인"]
        RLS_WRITE["UPDATE/DELETE: 소유자 확인"]
    end

    subgraph Response["응답"]
        DATA["데이터 반환"]
        ERROR["403/401 에러"]
    end

    USER --> MW
    MW --> MW_CHECK
    MW_CHECK -->|No| ERROR
    MW_CHECK -->|Yes| MW_STATUS
    MW_STATUS -->|pending| ERROR
    MW_STATUS -->|active| MW_ADMIN
    MW_ADMIN -->|실패| ERROR
    MW_ADMIN -->|성공| API

    API --> API_AUTH
    API_AUTH --> API_VALID
    API_VALID --> RLS

    RLS --> RLS_READ
    RLS_READ --> RLS_WRITE
    RLS_WRITE --> DATA

    style Layer1 fill:#fee2e2
    style Layer2 fill:#fef3c7
    style Layer3 fill:#d1fae5
```
