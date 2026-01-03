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

// Calendar Category 라벨 및 색상
export const CALENDAR_CATEGORY_CONFIG = {
  lab_meeting: {
    label: "랩미팅",
    color: "#3b82f6",
  },
  conference: {
    label: "학회",
    color: "#8b5cf6",
  },
  social: {
    label: "친목",
    color: "#f59e0b",
  },
  deadline: {
    label: "마감",
    color: "#ef4444",
  },
  seminar: {
    label: "세미나",
    color: "#10b981",
  },
  study: {
    label: "스터디",
    color: "#06b6d4",
  },
  field_trip: {
    label: "현장조사",
    color: "#84cc16",
  },
  vacation: {
    label: "휴가",
    color: "#6b7280",
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
    href: "/dashboard/members",
    icon: "Users",
  },
  {
    name: "Research Articles",
    href: "/dashboard/research",
    icon: "BookOpen",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: "Calendar",
  },
  {
    name: "Mentoring",
    href: "/dashboard/mentoring",
    icon: "MessageSquare",
  },
] as const;

// 관리자 메뉴
export const ADMIN_MENU = [
  {
    name: "회원 승인",
    href: "/admin/approvals",
    icon: "UserCheck",
  },
] as const;
