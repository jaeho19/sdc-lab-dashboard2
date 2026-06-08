import { createClient } from "@/lib/supabase/server";

// ISR: 60초마다 재검증 (페이지 캐시로 TTFB 대폭 감소)
export const revalidate = 60;

import type { SubmissionStatus, CalendarCategory } from "@/types/database.types";
import { SubmittedProjectsCard } from "@/components/features/SubmittedProjectsCard";
import { UnifiedDeadlineView, type UnifiedDeadlineItem } from "@/components/features/dashboard/unified-deadline-view";
import { AnnouncementsSection } from "@/components/features/dashboard/announcements-section";
import { DashboardCalendar } from "@/components/features/dashboard/dashboard-calendar";
import type { AnnouncementPriority } from "@/types/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
  const now = new Date().toISOString();

  // 캘린더 이벤트 날짜 범위 제한: 3개월 전 ~ 12개월 후
  const calRangeStart = new Date();
  calRangeStart.setMonth(calRangeStart.getMonth() - 3);
  const calRangeEnd = new Date();
  calRangeEnd.setMonth(calRangeEnd.getMonth() + 12);

  // 4개 쿼리를 병렬 실행 (순차 → 병렬로 ~50% 속도 개선)
  const [projectsResult, eventsResult, goalsResult, announcementsResult] = await Promise.all([
    supabase
      .from("research_projects")
      .select("id, title, status, overall_progress, updated_at, submission_status, target_journal, is_archived, first_author")
      .order("updated_at", { ascending: false }),

    supabase
      .from("calendar_events")
      .select("id, title, start_date, end_date, category, all_day, member_id")
      .gte("start_date", calRangeStart.toISOString().split("T")[0])
      .lte("start_date", calRangeEnd.toISOString().split("T")[0])
      .order("start_date", { ascending: true }),

    supabase
      .from("weekly_goals")
      .select(`
        id,
        content,
        deadline,
        linked_stage,
        project_id,
        is_completed,
        research_projects!inner (
          id,
          title,
          project_members (
            role,
            member_id,
            members (
              id,
              name,
              avatar_url
            )
          )
        )
      `)
      .gte("deadline", thirtyDaysAgoStr)
      .order("deadline", { ascending: true })
      .limit(50),

    supabase
      .from("announcements")
      .select(`
        id,
        title,
        content,
        priority,
        is_pinned,
        author_id,
        expires_at,
        created_at,
        updated_at,
        author:members (
          id,
          name
        )
      `)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const projects = projectsResult.data;
  const upcomingEvents = eventsResult.data;
  const memberGoals = goalsResult.data;

  if (eventsResult.error) {
    console.error("Calendar events fetch error:", eventsResult.error);
  }

  type AnnouncementRow = {
    id: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    author_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    author: { id: string; name: string } | null;
  };

  let announcements: AnnouncementRow[] = [];
  if (announcementsResult.error) {
    console.error("Announcements fetch error:", announcementsResult.error);
  } else {
    announcements = (announcementsResult.data || []) as AnnouncementRow[];
  }

  // 멤버 정보를 별도로 조회 (이벤트 결과에 의존하므로 후속 쿼리)
  const memberIds = (upcomingEvents || [])
    .map((e: { member_id: string | null }) => e.member_id)
    .filter((id): id is string => id !== null);

  const { data: eventMembers } = memberIds.length > 0
    ? await supabase
        .from("members")
        .select("id, name, avatar_url")
        .in("id", memberIds)
    : { data: [] };

  const memberMap = new Map(
    (eventMembers || []).map((m: { id: string; name: string; avatar_url: string | null }) => [m.id, m])
  );

  const projectList = (projects || []) as Array<{
    id: string;
    title: string;
    status: string;
    overall_progress: number;
    updated_at: string;
    submission_status: SubmissionStatus;
    target_journal: string | null;
    is_archived: boolean;
    first_author: string | null;
  }>;

  // 투고 중인 연구 (투고 후)
  const allSubmittedProjects = projectList.filter(
    (p) => p.submission_status &&
           p.submission_status !== "not_submitted"
  );

  // 활성 프로젝트 (아카이브되지 않은 것)
  const activeProjects = allSubmittedProjects.filter((p) => !p.is_archived);

  // 아카이브된 프로젝트
  const archivedProjects = allSubmittedProjects.filter((p) => p.is_archived);

  const eventList = (upcomingEvents || []).map((event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    category: CalendarCategory;
    all_day: boolean;
    member_id: string | null;
  }) => ({
    ...event,
    member: event.member_id ? memberMap.get(event.member_id) || null : null,
  })) as Array<{
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    category: CalendarCategory;
    all_day: boolean;
    member_id: string | null;
    member: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
  }>;

  // 목표를 통합 마감일 형식으로 변환
  const goalDeadlines: UnifiedDeadlineItem[] = (memberGoals || []).map((goal: {
    id: string;
    content: string;
    deadline: string;
    linked_stage: string | null;
    project_id: string;
    is_completed: boolean;
    research_projects: {
      id: string;
      title: string;
      project_members: Array<{
        role: string;
        member_id: string;
        members: {
          id: string;
          name: string;
          avatar_url: string | null;
        } | null;
      }>;
    };
  }) => {
    const project = goal.research_projects;
    const firstAuthor = project?.project_members?.find((pm) => pm.role === "first_author");
    const member = firstAuthor?.members || project?.project_members?.[0]?.members;

    return {
      id: goal.id,
      type: "goal" as const,
      title: goal.content,
      date: goal.deadline,
      memberName: member?.name || "미지정",
      memberAvatarUrl: member?.avatar_url,
      projectId: project?.id,
      projectTitle: project?.title,
      isCompleted: goal.is_completed,
    };
  });

  // 완료된 목표: 완료된 목표만 (날짜 내림차순 - 최근 완료 순)
  const completedDeadlines = goalDeadlines
    .filter((item) => item.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // 공지사항 데이터 변환
  const announcementItems = (announcements || []).map((a: {
    id: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    author_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    author: { id: string; name: string } | null;
  }) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    is_pinned: a.is_pinned,
    expires_at: a.expires_at,
    created_at: a.created_at,
    author: a.author,
  }));

  return (
    /**
     * Dashboard 레이아웃 수정사항:
     * - space-y-6 md:space-y-8: 섹션 간 기본 간격 증가
     * - 캘린더: min-h 사용으로 선택된 이벤트 상세 영역 공간 확보
     * - 그리드: gap-6 md:gap-8로 카드 간 여백 증가
     */
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          SDC Lab 연구실 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/*
        캘린더 섹션
        - min-h 사용: 선택된 이벤트 상세 영역이 표시될 때 자동 확장
        - 고정 높이 대신 min-height 사용으로 내용이 잘리지 않음
        - mb-4 md:mb-6: 하위 "다가오는 마감일" 섹션과 충분한 간격 확보
      */}
      <div className="mb-4 md:mb-6">
        <DashboardCalendar events={eventList} className="min-h-[500px] md:min-h-[600px]" />
      </div>

      {/*
        2열 그리드 레이아웃 (다가오는 마감일 제거)
        - 좌측 컬럼: 공지사항(상) + 완료된 목표(하)
        - 우측 컬럼: 투고 중인 연구가 2행을 차지해 더 길게 표시 (md:row-span-2)
        - 행 우선 흐름(grid auto-flow row)으로 배치되므로 컴포넌트 순서가 곧 배치 순서
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-6 md:gap-8">
        {/* 좌상단: 공지사항 */}
        <AnnouncementsSection
          announcements={announcementItems}
          maxItems={5}
          className="h-[600px] md:h-[675px]"
        />

        {/* 우측 컬럼 전체(2행 span): 투고 중인 연구 — 더 길게 */}
        <SubmittedProjectsCard
          projects={activeProjects}
          archivedProjects={archivedProjects}
          className="h-[600px] md:h-full md:row-span-2"
        />

        {/* 좌하단: 완료된 목표 */}
        <UnifiedDeadlineView
          items={completedDeadlines}
          title="완료된 목표"
          icon="history"
          variant="past"
          className="h-[600px] md:h-[675px]"
        />
      </div>
    </div>
  );
}
