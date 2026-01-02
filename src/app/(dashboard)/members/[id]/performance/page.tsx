import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  getInitials,
  getPositionLabel,
  getMilestoneStageLabel,
  formatDate,
  formatRelativeTime,
} from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MessageSquare,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface PerformancePageProps {
  params: Promise<{ id: string }>;
}

// 마일스톤 진행률 계산 (체크리스트 기반)
function calculateMilestoneProgress(
  checklistItems: Array<{ is_completed: boolean }>
): number {
  if (checklistItems.length === 0) return 0;
  const completed = checklistItems.filter((item) => item.is_completed).length;
  return Math.round((completed / checklistItems.length) * 100);
}

// 일정 준수율 계산
function calculateScheduleAdherence(
  milestones: Array<{
    end_date: string | null;
    completed_at: string | null;
    progress: number;
  }>
): { rate: number; onTime: number; delayed: number; total: number } {
  const completedMilestones = milestones.filter((m) => m.progress === 100);
  if (completedMilestones.length === 0) {
    return { rate: 100, onTime: 0, delayed: 0, total: 0 };
  }

  let onTime = 0;
  let delayed = 0;

  completedMilestones.forEach((m) => {
    if (!m.end_date || !m.completed_at) {
      onTime++; // 기한이 없으면 정상 완료로 간주
      return;
    }

    const endDate = new Date(m.end_date);
    const completedDate = new Date(m.completed_at);

    if (completedDate <= endDate) {
      onTime++;
    } else {
      delayed++;
    }
  });

  const total = onTime + delayed;
  const rate = total > 0 ? Math.round((onTime / total) * 100) : 100;

  return { rate, onTime, delayed, total };
}

export default async function MemberPerformancePage({
  params,
}: PerformancePageProps) {
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

  // 타입 정의
  type ProjectMemberWithDetails = {
    role: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
      deadline: string | null;
      created_at: string;
      milestones: Array<{
        id: string;
        stage: string;
        weight: number;
        start_date: string | null;
        end_date: string | null;
        completed_at: string | null;
        sort_order: number | null;
        checklist_items: Array<{
          id: string;
          content: string;
          is_completed: boolean;
          completed_at: string | null;
        }>;
      }>;
    } | null;
  };

  type MentoringPost = {
    id: string;
    content: string;
    created_at: string;
  };

  type MentoringComment = {
    id: string;
    content: string;
    created_at: string;
  };

  // 참여 프로젝트 조회 방법 1: project_members 테이블
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select(
      `
      role,
      research_projects (
        id,
        title,
        status,
        overall_progress,
        deadline,
        created_at,
        milestones (
          id,
          stage,
          weight,
          start_date,
          end_date,
          completed_at,
          sort_order,
          checklist_items (
            id,
            content,
            is_completed,
            completed_at
          )
        )
      )
    `
    )
    .eq("member_id", id) as { data: ProjectMemberWithDetails[] | null };

  // 참여 프로젝트 조회 방법 2: project_authors 테이블 (이름 기반)
  type ProjectAuthorWithProject = {
    role: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
      deadline: string | null;
      created_at: string;
      milestones: Array<{
        id: string;
        stage: string;
        weight: number;
        start_date: string | null;
        end_date: string | null;
        completed_at: string | null;
        sort_order: number | null;
        checklist_items: Array<{
          id: string;
          content: string;
          is_completed: boolean;
          completed_at: string | null;
        }>;
      }>;
    } | null;
  };

  const { data: projectAuthors } = await supabase
    .from("project_authors")
    .select(
      `
      role,
      research_projects (
        id,
        title,
        status,
        overall_progress,
        deadline,
        created_at,
        milestones (
          id,
          stage,
          weight,
          start_date,
          end_date,
          completed_at,
          sort_order,
          checklist_items (
            id,
            content,
            is_completed,
            completed_at
          )
        )
      )
    `
    )
    .eq("name", member.name) as { data: ProjectAuthorWithProject[] | null };

  // 두 소스의 프로젝트 병합 (중복 제거)
  const allProjectData = [
    ...(projectMembers || []),
    ...(projectAuthors || []),
  ];

  // 최근 체크리스트 완료 활동 조회 (최근 30일)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 멘토링 활동 조회
  const { data: mentoringPosts } = (await supabase
    .from("mentoring_posts")
    .select("id, content, created_at")
    .or(`author_id.eq.${id},target_member_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(10)) as { data: MentoringPost[] | null };

  const { data: mentoringComments } = (await supabase
    .from("mentoring_comments")
    .select("id, content, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(10)) as { data: MentoringComment[] | null };

  // 데이터 정리 (중복 프로젝트 제거)
  const seenProjectIds = new Set<string>();
  const projects = allProjectData
    .map((pm) => {
      const project = pm.research_projects;
      if (!project) return null;

      // 중복 프로젝트 제거
      if (seenProjectIds.has(project.id)) return null;
      seenProjectIds.add(project.id);

      return {
        ...project,
        role: pm.role,
        milestones: (project.milestones || []).sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        ),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // 종합 통계 계산
  const totalProjects = projects.length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + p.overall_progress, 0) /
            totalProjects
        )
      : 0;

  const allMilestones = projects.flatMap((p) =>
    p.milestones.map((m) => ({
      ...m,
      progress: calculateMilestoneProgress(m.checklist_items),
    }))
  );
  const completedMilestones = allMilestones.filter((m) => m.progress === 100);
  const totalMilestones = allMilestones.length;

  const scheduleStats = calculateScheduleAdherence(
    allMilestones.map((m) => ({
      end_date: m.end_date,
      completed_at: m.completed_at,
      progress: m.progress,
    }))
  );

  // 최근 활동 수집
  const recentActivities: Array<{
    type: "checklist" | "milestone" | "mentoring" | "comment";
    description: string;
    date: string;
    projectTitle?: string;
  }> = [];

  // 체크리스트 완료 활동
  projects.forEach((project) => {
    project.milestones.forEach((milestone) => {
      milestone.checklist_items
        .filter((item) => item.is_completed && item.completed_at)
        .forEach((item) => {
          recentActivities.push({
            type: "checklist",
            description: item.content,
            date: item.completed_at!,
            projectTitle: project.title,
          });
        });

      // 마일스톤 완료
      if (milestone.completed_at) {
        recentActivities.push({
          type: "milestone",
          description: `"${getMilestoneStageLabel(milestone.stage)}" 단계 완료`,
          date: milestone.completed_at,
          projectTitle: project.title,
        });
      }
    });
  });

  // 멘토링 활동
  (mentoringPosts || []).forEach((post) => {
    recentActivities.push({
      type: "mentoring",
      description:
        post.content.length > 50
          ? post.content.substring(0, 50) + "..."
          : post.content,
      date: post.created_at,
    });
  });

  // 댓글 활동
  (mentoringComments || []).forEach((comment) => {
    recentActivities.push({
      type: "comment",
      description:
        comment.content.length > 50
          ? comment.content.substring(0, 50) + "..."
          : comment.content,
      date: comment.created_at,
    });
  });

  // 최근 순으로 정렬 및 상위 15개만
  recentActivities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const displayActivities = recentActivities.slice(0, 15);

  // 역할 라벨
  function getRoleLabel(role: string) {
    const labels: Record<string, string> = {
      first_author: "1저자",
      corresponding: "교신저자",
      co_author: "공저자",
    };
    return labels[role] || role;
  }

  // 연월 포맷
  const formatYearMonth = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  // 날짜만 포맷 (MM/DD)
  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href={`/members/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-primary text-white">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{member.name} 성과 현황</h1>
            <p className="text-muted-foreground">
              {getPositionLabel(member.position)} |{" "}
              {member.admission_date
                ? `입학: ${formatYearMonth(member.admission_date)}`
                : ""}{" "}
              {member.graduation_date
                ? `| 예상 졸업: ${formatYearMonth(member.graduation_date)}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* 종합 지표 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">참여 연구</p>
                <p className="text-2xl font-bold">{totalProjects}건</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 진행률</p>
                <p className="text-2xl font-bold">{avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">완료 마일스톤</p>
                <p className="text-2xl font-bold">
                  {completedMilestones.length}/{totalMilestones}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  scheduleStats.rate >= 80
                    ? "bg-green-100"
                    : scheduleStats.rate >= 60
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }`}
              >
                <Clock
                  className={`h-5 w-5 ${
                    scheduleStats.rate >= 80
                      ? "text-green-600"
                      : scheduleStats.rate >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">일정 준수율</p>
                <p className="text-2xl font-bold">{scheduleStats.rate}%</p>
                {scheduleStats.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {scheduleStats.onTime}건 정시 / {scheduleStats.delayed}건
                    지연
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트별 진행 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            프로젝트별 진행 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              참여 중인 연구 프로젝트가 없습니다.
            </p>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  {/* 프로젝트 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/research/${project.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {project.title}
                      </Link>
                      <Badge variant="outline">{getRoleLabel(project.role)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        진행률:
                      </span>
                      <span className="font-bold">
                        {project.overall_progress}%
                      </span>
                    </div>
                  </div>

                  {/* 진행률 바 */}
                  <Progress
                    value={project.overall_progress}
                    className="h-2 mb-4"
                  />

                  {/* 마일스톤 목록 */}
                  <div className="space-y-2">
                    {project.milestones.map((milestone) => {
                      const progress = calculateMilestoneProgress(
                        milestone.checklist_items
                      );
                      const isCompleted = progress === 100;
                      const isCurrent = progress > 0 && progress < 100;

                      // 지연 여부 확인
                      const isDelayed =
                        milestone.end_date &&
                        !isCompleted &&
                        new Date(milestone.end_date) < new Date();

                      // 계획 대비 실제 완료일 비교
                      let completionStatus = "";
                      if (isCompleted && milestone.end_date && milestone.completed_at) {
                        const endDate = new Date(milestone.end_date);
                        const completedDate = new Date(milestone.completed_at);
                        const diffDays = Math.round(
                          (completedDate.getTime() - endDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        if (diffDays <= 0) {
                          completionStatus = `${Math.abs(diffDays)}일 조기 완료`;
                        } else {
                          completionStatus = `${diffDays}일 지연`;
                        }
                      }

                      return (
                        <div
                          key={milestone.id}
                          className={`flex items-center gap-3 p-2 rounded ${
                            isCompleted
                              ? "bg-green-50"
                              : isCurrent
                              ? "bg-blue-50"
                              : isDelayed
                              ? "bg-red-50"
                              : "bg-gray-50"
                          }`}
                        >
                          {/* 상태 아이콘 */}
                          <div className="w-6">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : isCurrent ? (
                              <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                              </div>
                            ) : isDelayed ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>

                          {/* 마일스톤 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  isCompleted
                                    ? "text-green-700"
                                    : isCurrent
                                    ? "text-blue-700"
                                    : isDelayed
                                    ? "text-red-700"
                                    : "text-gray-600"
                                }`}
                              >
                                {getMilestoneStageLabel(milestone.stage)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({progress}%)
                              </span>
                            </div>
                          </div>

                          {/* 일정 정보 */}
                          <div className="text-right text-sm">
                            {milestone.end_date && (
                              <div className="text-muted-foreground">
                                계획: {formatShortDate(milestone.end_date)}
                              </div>
                            )}
                            {isCompleted && milestone.completed_at && (
                              <div
                                className={
                                  completionStatus.includes("지연")
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                완료: {formatShortDate(milestone.completed_at)}
                                {completionStatus && (
                                  <span className="ml-1 text-xs">
                                    ({completionStatus})
                                  </span>
                                )}
                              </div>
                            )}
                            {!isCompleted && isCurrent && (
                              <div className="text-blue-600">진행중</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              최근 활동 기록이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {displayActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div
                    className={`p-1.5 rounded ${
                      activity.type === "checklist"
                        ? "bg-green-100"
                        : activity.type === "milestone"
                        ? "bg-purple-100"
                        : activity.type === "mentoring"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {activity.type === "checklist" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : activity.type === "milestone" ? (
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    ) : activity.type === "mentoring" ? (
                      <FileText className="h-4 w-4 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    {activity.projectTitle && (
                      <p className="text-xs text-muted-foreground">
                        {activity.projectTitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
