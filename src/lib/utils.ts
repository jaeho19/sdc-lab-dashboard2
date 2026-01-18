import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 이름에서 이니셜 추출
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return name.slice(0, 2).toUpperCase();
  }
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// 직위 라벨
export function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    professor: "교수",
    "post-doc": "POST-DOC",
    post_doc: "POST-DOC",
    phd: "박사과정",
    ms: "석사과정",
    researcher: "연구원",
  };
  return labels[position] || position;
}

// 고용 형태 라벨
export function getEmploymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "full-time": "풀타임",
    full_time: "풀타임",
    "part-time": "파트타임",
    part_time: "파트타임",
  };
  return labels[type] || type;
}

// 프로젝트 상태 라벨
export function getProjectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    preparing: "준비 중",
    submitting: "제출 중",
    in_progress: "진행 중",
    under_review: "심사 중",
    revision: "수정 중",
    accepted: "승인됨",
    completed: "완료",
    published: "출판됨",
    on_hold: "보류",
  };
  return labels[status] || status;
}

// 프로젝트 카테고리 라벨
export function getProjectCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    thesis: "학위논문",
    submission: "논문투고",
    revision: "논문수정",
    publication: "출판",
    other: "기타",
    grant: "연구과제",
    individual: "개별연구",
  };
  return labels[category] || category;
}

// 멤버 상태 라벨
export function getMemberStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "승인 대기",
    active: "활동 중",
    graduated: "졸업",
    leave: "휴학",
  };
  return labels[status] || status;
}

// 마일스톤 단계 라벨
export function getMilestoneStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    literature_review: "문헌조사",
    methodology: "방법론 설계",
    data_collection: "데이터 수집",
    analysis: "분석",
    draft_writing: "초고 작성",
    submission: "투고",
    review_revision: "심사/수정",
    publication: "게재확정",
  };
  return labels[stage] || stage;
}

// 캘린더 카테고리 라벨
export function getCalendarCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    lab_meeting: "랩미팅",
    conference: "학회",
    social: "친목",
    deadline: "마감",
    seminar: "세미나",
    study: "스터디",
    field_trip: "현장조사",
    vacation: "휴가",
    meeting: "미팅",
    holiday: "공휴일",
    personal: "개인",
    other: "기타",
  };
  return labels[category] || category;
}

// 날짜 포맷
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 상대적 시간 (예: 3일 전)
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

// D-day 계산
export function calculateDday(deadline: string | Date): { dday: number; label: string; isOverdue: boolean } {
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return { dday: 0, label: "D-Day", isOverdue: false };
  if (days > 0) return { dday: days, label: `D-${days}`, isOverdue: false };
  return { dday: days, label: `D+${Math.abs(days)}`, isOverdue: true };
}

// 프로젝트 타입 라벨
export function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    advanced: "선진연구",
    general: "일반연구",
  };
  return labels[type] || type;
}

// 저자 역할 라벨
export function getAuthorRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    first_author: "1저자",
    corresponding: "교신저자",
    co_author: "공저자",
  };
  return labels[role] || role;
}

// 투고 상태 설정 (카테고리별 그룹화)
export const SUBMISSION_STATUS_CATEGORIES = {
  under_review: {
    label: "Under Review",
    options: [
      { value: "submitted", label: "Submitted", description: "Submission completed" },
      { value: "under_review", label: "Under Review", description: "Review in progress" },
    ],
  },
  review_result: {
    label: "Review Result",
    options: [
      { value: "minor_revision", label: "Minor Revision", description: "Minor revision requested" },
      { value: "major_revision", label: "Major Revision", description: "Major revision requested" },
      { value: "rejected", label: "Rejected", description: "Publication rejected" },
    ],
  },
  revision: {
    label: "Revision / Resubmission",
    options: [
      { value: "under_revision", label: "Under Revision", description: "Revision in progress" },
      { value: "resubmitted", label: "Resubmitted", description: "Resubmission completed" },
      { value: "under_2nd_review", label: "Under 2nd Review", description: "2nd review in progress" },
    ],
  },
  final: {
    label: "Final",
    options: [
      { value: "accepted", label: "Accepted", description: "Publication accepted" },
      { value: "in_press", label: "In Press", description: "Editing/printing in progress" },
      { value: "published", label: "Published", description: "Publication completed" },
    ],
  },
} as const;

// 투고 상태 설정 (플랫 구조 - 기존 호환성 유지)
export const SUBMISSION_STATUS_CONFIG = {
  not_submitted: {
    label: "Not Submitted",
    color: "bg-gray-100 text-gray-700",
    badgeVariant: "secondary" as const,
  },
  ready_to_submit: {
    label: "투고 준비 완료",
    color: "bg-emerald-100 text-emerald-700",
    badgeVariant: "default" as const,
  },
  // Under Review Phase
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-700",
    badgeVariant: "default" as const,
  },
  under_review: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-700",
    badgeVariant: "default" as const,
  },
  // Review Result
  minor_revision: {
    label: "Minor Revision",
    color: "bg-cyan-100 text-cyan-700",
    badgeVariant: "default" as const,
  },
  major_revision: {
    label: "Major Revision",
    color: "bg-orange-100 text-orange-700",
    badgeVariant: "destructive" as const,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    badgeVariant: "destructive" as const,
  },
  // Revision / Resubmission
  under_revision: {
    label: "Under Revision",
    color: "bg-amber-100 text-amber-700",
    badgeVariant: "default" as const,
  },
  resubmitted: {
    label: "Resubmitted",
    color: "bg-indigo-100 text-indigo-700",
    badgeVariant: "default" as const,
  },
  under_2nd_review: {
    label: "Under 2nd Review",
    color: "bg-violet-100 text-violet-700",
    badgeVariant: "default" as const,
  },
  // Final
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-700",
    badgeVariant: "default" as const,
  },
  in_press: {
    label: "In Press",
    color: "bg-emerald-100 text-emerald-700",
    badgeVariant: "default" as const,
  },
  published: {
    label: "Published",
    color: "bg-teal-100 text-teal-700",
    badgeVariant: "default" as const,
  },
} as const;

export type SubmissionStatusKey = keyof typeof SUBMISSION_STATUS_CONFIG;

// 투고 상태 라벨
export function getSubmissionStatusLabel(status: string): string {
  return SUBMISSION_STATUS_CONFIG[status as SubmissionStatusKey]?.label || status;
}

// 투고 상태 색상 클래스
export function getSubmissionStatusColor(status: string): string {
  return SUBMISSION_STATUS_CONFIG[status as SubmissionStatusKey]?.color || "bg-gray-100 text-gray-700";
}

// 6단계 마일스톤 정의 (투고까지 100%)
export const MILESTONE_STAGES = [
  {
    key: "literature_review",
    label: "문헌조사",
    weight: 15,
    checklist: [
      "주요 키워드 검색 (Google Scholar, DBpia)",
      "관련 핵심 논문 10편 선정",
      "기존 연구 한계점 도출",
      "연구 차별성 확보",
    ],
  },
  {
    key: "methodology",
    label: "방법론 설계",
    weight: 15,
    checklist: [
      "연구 가설 설정",
      "변수 정의 및 측정 방법 결정",
      "분석 모형(알고리즘) 선정",
      "데이터 확보 계획 수립",
    ],
  },
  {
    key: "data_collection",
    label: "데이터 수집",
    weight: 15,
    checklist: [
      "공공데이터 포털 데이터 확보",
      "데이터 전처리 및 정제",
      "결측치 및 이상치 처리",
      "데이터 구조화 완료",
    ],
  },
  {
    key: "analysis",
    label: "분석",
    weight: 25,
    checklist: [
      "기초 통계 분석",
      "시각화 수행",
      "가설 검증 / 모델 학습",
      "분석 결과 해석",
    ],
  },
  {
    key: "draft_writing",
    label: "초고 작성",
    weight: 20,
    checklist: [
      "서론 및 이론적 배경 작성",
      "연구 방법 기술",
      "분석 결과 정리",
      "결론 및 시사점 도출",
    ],
  },
  {
    key: "submission",
    label: "투고",
    weight: 10,
    checklist: [
      "타겟 저널 포맷팅 (Author Guidelines)",
      "Cover Letter 작성",
      "Manuscript 제출",
      "심사료 납부",
    ],
  },
] as const;

// 프로젝트 상태 자동 계산
export function calculateProjectStatus(
  progress: number,
  deadline: string | null
): "preparing" | "in_progress" | "on_track" | "delayed" {
  if (progress === 0) return "preparing";

  if (!deadline) return "in_progress";

  const { dday, isOverdue } = calculateDday(deadline);

  if (isOverdue) return "delayed";

  // 마감까지 남은 일수 대비 진행률 체크
  // 예: 30일 남았는데 진행률이 30% 미만이면 delayed
  const expectedProgress = Math.max(0, 100 - (dday * 2)); // 간단한 휴리스틱

  if (progress < expectedProgress * 0.7) return "delayed";

  return "on_track";
}

// ===== 풀타임 멤버 간트차트 관련 타입 및 헬퍼 함수 =====

export type GanttMemberStatus = "active" | "graduating_soon" | "graduated";

export interface GanttMemberData {
  id: string;
  name: string;
  position: string;
  startDate: string; // ISO 문자열 (서버-클라이언트 직렬화 호환)
  endDate: string;   // ISO 문자열
  status: GanttMemberStatus;
}

/**
 * 멤버 데이터에서 풀타임 멤버만 필터링하여 간트차트용 데이터로 변환
 */
export function filterFullTimeMembersForGantt<T extends {
  id: string;
  name: string;
  position: string;
  employment_type: string;
  admission_date: string | null;
  graduation_date: string | null;
  enrollment_year: number | null;
  expected_graduation_year: number | null;
  status: string;
}>(members: T[]): GanttMemberData[] {
  const today = new Date();

  return members
    .filter(m => m.employment_type === "full-time" && m.position !== "professor")
    .map(m => {
      // 시작일: admission_date 우선, 없으면 enrollment_year 사용
      let startDate: Date;
      if (m.admission_date) {
        startDate = new Date(m.admission_date);
      } else if (m.enrollment_year) {
        // enrollment_year만 있는 경우 3월 1일로 가정
        startDate = new Date(m.enrollment_year, 2, 1);
      } else {
        // 날짜 정보 없으면 현재 날짜
        startDate = new Date();
      }

      // 종료일: graduation_date 우선, 없으면 expected_graduation_year 사용
      let endDate: Date;
      if (m.graduation_date) {
        endDate = new Date(m.graduation_date);
      } else if (m.expected_graduation_year) {
        // expected_graduation_year만 있는 경우 2월 28일로 가정
        endDate = new Date(m.expected_graduation_year, 1, 28);
      } else {
        // 날짜 정보 없으면 시작일 + 2년
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 2);
      }

      // 상태 결정
      let status: GanttMemberStatus = "active";
      if (m.status === "graduated") {
        status = "graduated";
      } else {
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        if (endDate <= sixMonthsLater) {
          status = "graduating_soon";
        }
      }

      // 타임존 문제 방지를 위해 YYYY-MM-DD 형식의 문자열로 저장
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        id: m.id,
        name: m.name,
        position: m.position,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        status,
      };
    })
    .filter(m => m.startDate && m.endDate) // 유효한 날짜가 있는 멤버만
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); // 입학일 순 정렬
}
