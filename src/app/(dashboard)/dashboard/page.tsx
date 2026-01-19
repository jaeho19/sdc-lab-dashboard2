import { createClient } from "@/lib/supabase/server";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { SubmissionStatus, CalendarCategory } from "@/types/database.types";
import { SubmittedProjectsCard } from "@/components/features/SubmittedProjectsCard";
import { UnifiedDeadlineView, type UnifiedDeadlineItem } from "@/components/features/dashboard/unified-deadline-view";
import { AnnouncementsSection } from "@/components/features/dashboard/announcements-section";
import { DashboardCalendar } from "@/components/features/dashboard/dashboard-calendar";
import type { AnnouncementPriority } from "@/types/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("research_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  // 모든 캘린더 이벤트 조회 (캘린더 페이지와 동일)
  const { data: upcomingEvents, error: eventsError } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (eventsError) {
    console.error("Calendar events fetch error:", eventsError);
  }

  // 멤버 정보를 별도로 조회
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

  // 모든 멤버의 목표 조회 (미완료 + 최근 완료된 목표 포함)
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: memberGoals } = await supabase
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
    .limit(50);

  // 공지사항 조회 (만료되지 않은 것만)
  const now = new Date().toISOString();
  let announcements: Array<{
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
  }> = [];

  try {
    const { data: announcementsData, error: announcementsError } = await supabase
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
      .limit(10);

    if (announcementsError) {
      console.error("Announcements fetch error:", announcementsError);
    } else {
      announcements = (announcementsData || []) as typeof announcements;
    }
  } catch (e) {
    console.error("Announcements query failed:", e);
  }

  const projectList = (projects || []) as Array<{
    id: string;
    title: string;
    status: string;
    overall_progress: number;
    updated_at: string;
    submission_status: SubmissionStatus;
    target_journal: string | null;
    is_archived: boolean;
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

  // 캘린더 이벤트를 통합 마감일 형식으로 변환 (미래 일정만)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDeadlines: UnifiedDeadlineItem[] = eventList
    .filter((event) => {
      const eventDate = new Date(event.start_date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today; // 오늘 포함, 과거 제외
    })
    .map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      date: event.start_date,
      category: event.category,
      memberName: event.member?.name || "Lab",
      memberAvatarUrl: event.member?.avatar_url,
      memberId: event.member_id || undefined,
      isAllDay: event.all_day,
    }));

  // 다가오는 마감일: 미완료 목표 + 오늘 이후 일정 (날짜 오름차순)
  const upcomingDeadlines = [...goalDeadlines, ...calendarDeadlines]
    .filter((item) => !item.isCompleted)  // 미완료만
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20);

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
        2×2 그리드 레이아웃
        - gap-6 md:gap-8: 카드 간 여백 증가 (기존 gap-4 md:gap-6)
        - 모든 카드 동일 높이 유지
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* 첫 번째 행 좌측: 다가오는 마감일 */}
        <UnifiedDeadlineView
          items={upcomingDeadlines}
          title="다가오는 마감일"
          icon="clock"
          variant="upcoming"
          className="h-[600px] md:h-[675px]"
        />

        {/* 첫 번째 행 우측: 공지사항 */}
        <AnnouncementsSection
          announcements={announcementItems}
          maxItems={5}
          className="h-[600px] md:h-[675px]"
        />

        {/* 두 번째 행 좌측: 완료된 목표 */}
        <UnifiedDeadlineView
          items={completedDeadlines}
          title="완료된 목표"
          icon="history"
          variant="past"
          className="h-[600px] md:h-[675px]"
        />

        {/* 두 번째 행 우측: 투고 중인 연구 */}
        <SubmittedProjectsCard
          projects={activeProjects}
          archivedProjects={archivedProjects}
          className="h-[600px] md:h-[675px]"
        />
      </div>
    </div>
  );
}
