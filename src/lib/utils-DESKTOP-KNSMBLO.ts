import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    professor: "교수",
    post_doc: "박사후연구원",
    phd: "박사과정",
    researcher: "연구원",
    ms: "석사과정",
  };
  return labels[position] || position;
}

export function getEmploymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    full_time: "풀타임",
    part_time: "파트타임",
  };
  return labels[type] || type;
}

export function getMemberStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "승인대기",
    active: "활동중",
    graduated: "졸업",
    leave: "휴학",
  };
  return labels[status] || status;
}

export function getProjectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    preparing: "준비중",
    submitting: "투고중",
    under_review: "심사중",
    revision: "수정중",
    accepted: "게재확정",
    published: "출판완료",
  };
  return labels[status] || status;
}

export function getProjectCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    thesis: "학위논문",
    submission: "학술지 투고",
    revision: "수정/재투고",
    individual: "개인 연구",
    grant: "연구과제",
  };
  return labels[category] || category;
}

export function getMilestoneStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    literature_review: "문헌 조사",
    methodology: "연구 방법론",
    data_collection: "데이터 수집",
    analysis: "데이터 분석",
    draft_writing: "논문 작성",
    submission: "투고",
    review_revision: "심사/수정",
    publication: "출판",
  };
  return labels[stage] || stage;
}

export function getCalendarCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    lab_meeting: "랩미팅",
    conference: "학회",
    social: "사교행사",
    deadline: "마감일",
    seminar: "세미나",
    study: "스터디",
    field_trip: "현장답사",
    vacation: "휴가",
  };
  return labels[category] || category;
}
