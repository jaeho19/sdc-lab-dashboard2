import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  getInitials,
  getPositionLabel,
  getEmploymentTypeLabel,
  getMemberStatusLabel,
  getProjectStatusLabel,
  formatDate,
} from "@/lib/utils";
import { Mail, GraduationCap, Calendar, FileText, Sparkles, Pencil, Plus, BarChart3, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Database, CalendarCategory, MilestoneStage } from "@/types/database.types";
import { DeleteProjectButton } from "@/components/features/DeleteProjectButton";
import { TimelineCalendar } from "@/components/features/members/timeline-calendar";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 멤버 정보 조회
  const { data: memberData } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (!memberData) {
    notFound();
  }

  const member = memberData as Member;

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  let isAdmin = false;
  let currentUserId: string | null = null;

  if (user) {
    currentUserId = user.id;
    const { data: currentMember } = await supabase
      .from("members")
      .select("id, position")
      .eq("id", user.id)
      .single() as { data: { id: string; position: string } | null };

    if (currentMember) {
      isAdmin = currentMember.position === "professor";
      const isOwner = currentMember.id === id;
      canEdit = isAdmin || isOwner;
    }
  }

  // 참여 프로젝트 조회
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select(
      `
      role,
      project_id,
      research_projects (
        id,
        title,
        status,
        overall_progress,
        created_by
      )
    `
    )
    .eq("member_id", id);

  // 2주 날짜 범위 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  const twoWeeksLaterStr = twoWeeksLater.toISOString().split("T")[0];

  // 프로젝트 ID 목록 (타입 명시)
  const projectMembersList = (projectMembers || []) as Array<{
    role: string;
    project_id: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
      created_by: string;
    } | null;
  }>;
  const projectIds = projectMembersList
    .map((pm) => pm.project_id)
    .filter(Boolean);

  // 주간 목표 조회
  let weeklyGoalsData: Array<{
    id: string;
    content: string;
    deadline: string;
    linked_stage: MilestoneStage | null;
    is_completed: boolean;
    research_projects: { id: string; title: string } | null;
  }> = [];

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("weekly_goals")
      .select(
        `
        id,
        content,
        deadline,
        linked_stage,
        is_completed,
        research_projects (id, title)
      `
      )
      .in("project_id", projectIds)
      .gte("deadline", todayStr)
      .lte("deadline", twoWeeksLaterStr)
      .eq("is_completed", false)
      .order("deadline", { ascending: true });

    weeklyGoalsData = (data || []) as typeof weeklyGoalsData;
  }

  // 마일스톤 조회
  let milestonesData: Array<{
    id: string;
    stage: MilestoneStage;
    start_date: string | null;
    end_date: string | null;
    sort_order: number;
    research_projects: { id: string; title: string } | null;
  }> = [];

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("milestones")
      .select(
        `
        id,
        stage,
        start_date,
        end_date,
        sort_order,
        research_projects (id, title)
      `
      )
      .in("project_id", projectIds)
      .not("start_date", "is", null)
      .not("end_date", "is", null);

    milestonesData = (data || []) as typeof milestonesData;
  }

  // 마일스톤 진행률 조회 (체크리스트 기반)
  const milestoneIds = milestonesData.map((m) => m.id);
  const checklistCounts: Record<string, { total: number; completed: number }> = {};

  if (milestoneIds.length > 0) {
    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("milestone_id, is_completed")
      .in("milestone_id", milestoneIds);

    const checklistItemsList = (checklistItems || []) as Array<{
      milestone_id: string;
      is_completed: boolean;
    }>;

    checklistItemsList.forEach((item) => {
      if (!checklistCounts[item.milestone_id]) {
        checklistCounts[item.milestone_id] = { total: 0, completed: 0 };
      }
      checklistCounts[item.milestone_id].total++;
      if (item.is_completed) {
        checklistCounts[item.milestone_id].completed++;
      }
    });
  }

  // 개별 캘린더 이벤트 조회 (2주 범위)
  const { data: memberEventsData } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("member_id", id)
    .gte("start_datetime", todayStr)
    .lte("start_datetime", twoWeeksLaterStr)
    .order("start_datetime", { ascending: true });

  const memberEvents = (memberEventsData || []) as Array<{
    id: string;
    title: string;
    start_datetime: string;
    category: string;
  }>;

  // 멘토링 기록 조회 (해당 연구원이 대상인 멘토링)
  const { data: mentoringPosts } = await supabase
    .from("mentoring_posts")
    .select("*")
    .eq("target_member_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  // projectList는 위에서 정의한 projectMembersList 사용
  const projectList = projectMembersList;

  const mentoringList = (mentoringPosts || []) as Array<{
    id: string;
    content: string;
    meeting_date: string | null;
    created_at: string;
  }>;

  // Timeline용 데이터 변환
  const timelineWeeklyGoals = weeklyGoalsData.map((goal) => ({
    id: goal.id,
    content: goal.content,
    deadline: goal.deadline,
    linked_stage: goal.linked_stage,
    is_completed: goal.is_completed,
    projectTitle: goal.research_projects?.title || "",
    projectId: goal.research_projects?.id || "",
  }));

  const timelineMilestones = milestonesData
    .filter((m) => {
      // 2주 범위와 겹치는 마일스톤만 필터링
      if (!m.start_date || !m.end_date) return false;
      return m.start_date <= twoWeeksLaterStr && m.end_date >= todayStr;
    })
    .map((milestone) => {
      const counts = checklistCounts[milestone.id] || { total: 0, completed: 0 };
      const progress =
        counts.total > 0
          ? Math.round((counts.completed / counts.total) * 100)
          : 0;
      return {
        id: milestone.id,
        stage: milestone.stage,
        startDate: milestone.start_date,
        endDate: milestone.end_date,
        progress,
        projectTitle: milestone.research_projects?.title || "",
        projectId: milestone.research_projects?.id || "",
      };
    });

  const timelineCalendarEvents = (memberEvents || []).map((event) => ({
    id: event.id,
    title: event.title,
    startDatetime: event.start_datetime,
    category: event.category as CalendarCategory,
  }));

  function getPositionBadgeVariant(position: string) {
    const variants: Record<string, "professor" | "post_doc" | "phd" | "researcher" | "ms"> = {
      professor: "professor",
      post_doc: "post_doc",
      phd: "phd",
      researcher: "researcher",
      ms: "ms",
    };
    return variants[position] || "default";
  }

  function getRoleLabel(role: string) {
    const labels: Record<string, string> = {
      first_author: "제1저자",
      corresponding: "교신저자",
      co_author: "공저자",
    };
    return labels[role] || role;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-sidebar-primary text-white">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold">{member.name}</h1>
                <div className="flex gap-2">
                  <Link href={`/members/${id}/performance`}>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      성과 현황
                    </Button>
                  </Link>
                  {canEdit && (
                    <Link href={`/members/${id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        정보 수정
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                <Badge variant={getPositionBadgeVariant(member.position)}>
                  {getPositionLabel(member.position)}
                </Badge>
                <Badge variant="outline">
                  {getEmploymentTypeLabel(member.employment_type)}
                </Badge>
                <Badge variant="secondary">
                  {getMemberStatusLabel(member.status)}
                </Badge>
              </div>

            </div>
          </div>

          {/* 상세 정보 그리드 */}
          {(() => {
            const isStudent = member.position === "phd" || member.position === "ms";
            const startLabel = isStudent ? "입학일" : "계약일";
            const endLabel = isStudent ? "졸업예정일" : "계약 만료일";

            const formatYearMonth = (dateStr: string | null) => {
              if (!dateStr) return null;
              const date = new Date(dateStr);
              return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
            };

            return (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    이메일
                  </div>
                  <p className="font-medium">{member.email}</p>
                </div>

                {/* 입학일/계약일 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {startLabel}
                  </div>
                  <p className="font-medium">
                    {member.admission_date
                      ? formatYearMonth(member.admission_date)
                      : member.enrollment_year
                      ? `${member.enrollment_year}년`
                      : "-"}
                  </p>
                </div>

                {/* 졸업예정일/계약 만료일 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    {endLabel}
                  </div>
                  <p className="font-medium">
                    {member.graduation_date
                      ? formatYearMonth(member.graduation_date)
                      : member.expected_graduation_year
                      ? `${member.expected_graduation_year}년`
                      : "-"}
                  </p>
                </div>

                {/* 관심분야 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    관심분야
                  </div>
                  <p className="font-medium">{member.interests || "-"}</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Research Articles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research Articles
            </CardTitle>
            {canEdit && (
              <Link href="/research/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  새 프로젝트
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectList.map((pm, index) => {
                const project = pm.research_projects;
                if (!project) return null;
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/research/${project.id}`} className="flex-1 min-w-0">
                        <h4 className="font-medium truncate hover:text-primary transition-colors">
                          {project.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">
                          {getRoleLabel(pm.role)}
                        </Badge>
                        {(isAdmin || project.created_by === currentUserId) && (
                          <DeleteProjectButton
                            projectId={project.id}
                            projectTitle={project.title}
                            redirectPath={`/members/${id}`}
                          />
                        )}
                      </div>
                    </div>
                    <Link href={`/research/${project.id}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                        <div className="flex-1">
                          <Progress
                            value={project.overall_progress}
                            className="h-2"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.overall_progress}%
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
              {projectList.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  참여 중인 Research Article이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 타임라인 캘린더 */}
        <TimelineCalendar
          memberId={id}
          weeklyGoals={timelineWeeklyGoals}
          milestones={timelineMilestones}
          calendarEvents={timelineCalendarEvents}
        />
      </div>

      {/* 최근 멘토링 기록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            최근 멘토링 기록
          </CardTitle>
          {isAdmin && (
            <Link href={`/mentoring/new?target=${id}`}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                멘토링 기록 작성
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mentoringList.map((post) => (
              <Link
                key={post.id}
                href={`/mentoring/${post.id}`}
                className="block"
              >
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    {post.meeting_date && (
                      <Badge variant="outline">
                        {formatDate(post.meeting_date)}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                </div>
              </Link>
            ))}
            {mentoringList.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                멘토링 기록이 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
