// Position 라벨 및 색상
export const POSITION_CONFIG = {
  professor: {
    label: "Professor",
    color: "bg-red-500",
    textColor: "text-red-500",
  },
  post_doc: {
    label: "POST-DOC",
    color: "bg-position-post-doc",
    textColor: "text-position-post-doc",
  },
  phd: {
    label: "PHD",
    color: "bg-position-phd",
    textColor: "text-position-phd",
  },
  researcher: {
    label: "RESEARCHER",
    color: "bg-position-researcher",
    textColor: "text-position-researcher",
  },
  ms: {
    label: "MS",
    color: "bg-position-ms",
    textColor: "text-position-ms",
  },
} as const;

// Employment Type 라벨
export const EMPLOYMENT_TYPE_LABEL = {
  full_time: "풀타임",
  part_time: "파트타임",
} as const;

// Member Status 라벨
export const MEMBER_STATUS_LABEL = {
  pending: "승인 대기",
  active: "활동 중",
  graduated: "졸업",
  leave: "휴학/퇴직",
} as const;

// Project Category 라벨
export const PROJECT_CATEGORY_LABEL = {
  thesis: "학위논문",
  submission: "투고",
  revision: "수정",
  individual: "개인연구",
  grant: "과제",
} as const;

// Project Status 라벨
export const PROJECT_STATUS_LABEL = {
  preparing: "준비 중",
  submitting: "투고 중",
  under_review: "심사 중",
  revision: "수정 중",
  accepted: "승인됨",
  published: "출판됨",
} as const;

// Milestone Stage 라벨
export const MILESTONE_STAGE_LABEL = {
  literature_review: "문헌조사",
  methodology: "방법론 설계",
  data_collection: "데이터 수집",
  analysis: "분석",
  draft_writing: "초고 작성",
  submission: "투고",
  review_revision: "심사 수정",
  publication: "출판",
} as const;

// Milestone Stage 파스텔톤 색상
export const MILESTONE_STAGE_COLORS = {
  literature_review: "#FFB3BA",  // 연한 핑크 - 문헌조사
  methodology: "#BAFFC9",        // 연한 민트 - 방법론 설계
  data_collection: "#BAE1FF",    // 연한 블루 - 데이터 수집
  analysis: "#FFFFBA",           // 연한 옐로우 - 분석
  draft_writing: "#FFDFBa",      // 연한 피치 - 초고 작성
  submission: "#E2BAFF",         // 연한 라벤더 - 투고
  review_revision: "#C9F0FF",    // 연한 스카이 - 심사 수정
  publication: "#D4EDDA",        // 연한 그린 - 출판
  default: "#E5E7EB",            // 기본 연한 회색
} as const;

// Calendar Category 라벨 및 색상
export const CALENDAR_CATEGORY_CONFIG = {
  meeting: {
    label: "미팅",
    color: "#3b82f6",
  },
  conference: {
    label: "학회",
    color: "#8b5cf6",
  },
  lecture: {
    label: "강의 / 수업",
    color: "#f59e0b",
  },
  deadline: {
    label: "마감",
    color: "#ef4444",
  },
  proposal: {
    label: "제안서 발표",
    color: "#06b6d4",
  },
  seminar: {
    label: "세미나",
    color: "#10b981",
  },
  vacation: {
    label: "휴가",
    color: "#6b7280",
  },
  dinner: {
    label: "회식",
    color: "#ec4899",
  },
} as const;

// 타임라인 아이템 타입 설정
export const TIMELINE_ITEM_CONFIG = {
  weekly_goal: {
    label: "주간 목표",
    color: "#f59e0b",
    bgClass: "bg-amber-500",
  },
  milestone: {
    label: "마일스톤",
    color: "#3b82f6",
    bgClass: "bg-blue-500",
  },
} as const;

// 파일 업로드 설정
export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: [".pdf", ".docx", ".xlsx", ".pptx", ".png", ".jpg", ".md"],
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
    "text/markdown",
  ],
} as const;

// 사이드바 메뉴
export const SIDEBAR_MENU = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    name: "Members",
    href: "/members",
    icon: "Users",
  },
  {
    name: "Research Articles",
    href: "/research",
    icon: "BookOpen",
  },
  {
    name: "Research Notes",
    href: "/research-notes",
    icon: "FileText",
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: "Calendar",
  },
  {
    name: "Mentoring",
    href: "/mentoring",
    icon: "MessageSquare",
  },
] as const;

// 사사표기 (Funding Acknowledgment) 매핑
export const FUNDING_ACKNOWLEDGMENT: Record<string, string> = {
  "502f916f-0553-4123-825d-bdd0d572cbdd": "우수신진연구",      // Beyond Distance
  "94842eb1-cddc-4c15-95ef-d06816e4c5c5": "생애첫연구",        // Navigating Towards Inclusivity
  "70244b6b-19be-4ac8-b6a0-8fd57a21bd7b": "교내 R&D",          // Beyond Proximity
  "07cd46ab-6bcd-4433-8edc-af41c9f86210": "교내 R&D",          // From Quantity to Quality
  "d1c58ad6-955b-4af2-aab8-38955e0cac7e": "우수신진연구",      // Does Urban Redevelopment
  "88c9f4dc-716c-446e-acf0-5d9cdee6d504": "교내 학술연구비",   // Green Space Patterns
} as const;

// 사사표기 뱃지 색상
export const FUNDING_BADGE_COLORS: Record<string, string> = {
  "우수신진연구": "bg-violet-100 text-violet-700 border-violet-200",
  "생애첫연구": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "교내 R&D": "bg-sky-100 text-sky-700 border-sky-200",
  "교내 학술연구비": "bg-amber-100 text-amber-700 border-amber-200",
} as const;

// 관리자 메뉴
export const ADMIN_MENU = [
  {
    name: "회원 승인",
    href: "/admin/approvals",
    icon: "UserCheck",
  },
] as const;
