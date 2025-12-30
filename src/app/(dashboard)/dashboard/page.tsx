import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Heart,
  MessageCircle,
  CheckSquare,
} from "lucide-react";
import {
  formatDate,
  getProjectStatusLabel,
  getCalendarCategoryLabel,
  getInitials,
  getPositionLabel,
} from "@/lib/utils";
import type { SubmissionStatus } from "@/types/database.types";
import Link from "next/link";
import { SubmittedProjectsCard } from "@/components/features/SubmittedProjectsCard";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 통계 데이터 조회
  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("status", "active");

  const { data: projects } = await supabase
    .from("research_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: upcomingEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(5);

  const { data: recentMentoring } = await supabase
    .from("mentoring_posts")
    .select(`
      *,
      author:members!mentoring_posts_author_id_fkey (
        id,
        name,
        position,
        avatar_url
      ),
      comments:mentoring_comments (
        id,
        content,
        created_at,
        author:members (
          id,
          name,
          avatar_url
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(3);

  const memberList = (members || []) as Array<{
    id: string;
    name: string;
    position: string;
  }>;
  const projectList = (projects || []) as Array<{
    id: string;
    title: string;
    status: string;
    overall_progress: number;
    updated_at: string;
    submission_status: SubmissionStatus;
    target_journal: string | null;
  }>;

  // 진행 중인 연구 (아직 투고 전)
  const inProgressProjects = projectList.filter(
    (p) => p.submission_status === "not_submitted" || !p.submission_status
  );

  // 투고 중인 연구 (투고 후)
  const submittedProjects = projectList.filter(
    (p) => p.submission_status && p.submission_status !== "not_submitted"
  );

  const eventList = (upcomingEvents || []) as Array<{
    id: string;
    title: string;
    start_date: string;
    category: string;
    all_day: boolean;
  }>;
  const mentoringList = (recentMentoring || []) as Array<{
    id: string;
    content: string;
    meeting_date: string | null;
    next_steps: string[] | null;
    likes_count: number;
    created_at: string;
    author: {
      id: string;
      name: string;
      position: string;
      avatar_url: string | null;
    } | null;
    comments: Array<{
      id: string;
      content: string;
      created_at: string;
      author: {
        id: string;
        name: string;
        avatar_url: string | null;
      } | null;
    }>;
  }>;

  const activeProjectsCount = projectList.filter(
    (p) => p.status !== "published"
  ).length;
  const avgProgress =
    projectList.length > 0
      ? Math.round(
          projectList.reduce((sum, p) => sum + p.overall_progress, 0) /
            projectList.length
        )
      : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          SDC Lab 연구실 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">활동 연구원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{memberList.length}명</div>
            <p className="text-xs text-muted-foreground">
              풀타임 + 파트타임
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">진행 중 연구</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{activeProjectsCount}건</div>
            <p className="text-xs text-muted-foreground">
              전체 {projectList.length}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">평균 진행률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">이번 주 일정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{eventList.length}건</div>
            <p className="text-xs text-muted-foreground">다가오는 일정</p>
          </CardContent>
        </Card>
      </div>

      {/* 1행: 진행 중인 연구 + 투고 중인 연구 (2열) */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {/* 진행 중인 연구 (투고 전) */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              진행 중인 연구
              <Badge variant="secondary" className="ml-auto text-xs">
                {inProgressProjects.length}건
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              {inProgressProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/research/${project.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium truncate text-sm md:text-base">{project.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {project.overall_progress}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={project.overall_progress}
                      className="w-16 md:w-20 h-2 shrink-0"
                    />
                  </div>
                </Link>
              ))}
              {inProgressProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  진행 중인 연구가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 투고 중인 연구 (투고 후) - 클라이언트 컴포넌트 */}
        <SubmittedProjectsCard projects={submittedProjects} />
      </div>

      {/* 2행: 다가오는 일정 (전체 너비) */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            다가오는 일정
            <Badge variant="secondary" className="ml-auto text-xs">
              {eventList.length}건
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {eventList.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] md:text-xs text-primary font-medium">
                      {new Date(event.start_date).toLocaleDateString(
                        "ko-KR",
                        { month: "short" }
                      )}
                    </span>
                    <span className="text-base md:text-lg font-bold text-primary">
                      {new Date(event.start_date).getDate()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm md:text-base">{event.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {getCalendarCategoryLabel(event.category)}
                    </Badge>
                    {!event.all_day && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.start_date).toLocaleTimeString(
                          "ko-KR",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {eventList.length === 0 && (
              <p className="text-center text-muted-foreground py-4 col-span-full">
                다가오는 일정이 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 최근 멘토링 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
            최근 멘토링 기록
          </CardTitle>
          <Link href="/mentoring" className="text-xs md:text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="space-y-3 md:space-y-4">
            {mentoringList.map((post) => (
              <Link
                key={post.id}
                href={`/mentoring/${post.id}`}
                className="block"
              >
                <div className="p-3 md:p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  {/* Author info */}
                  <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-sidebar-primary text-white text-xs md:text-sm">
                        {post.author ? getInitials(post.author.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm md:text-base">
                          {post.author?.name || "Unknown"}
                        </span>
                        {post.author?.position && (
                          <Badge variant="outline" className="text-xs">
                            {getPositionLabel(post.author.position)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {post.meeting_date ? formatDate(post.meeting_date) : formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.content}
                  </p>

                  {/* Next Steps */}
                  {post.next_steps && post.next_steps.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare className="h-3 w-3 text-primary" />
                        <span className="font-medium text-xs">NEXT STEPS</span>
                      </div>
                      <ul className="space-y-0.5">
                        {post.next_steps.slice(0, 2).map((step, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>•</span> {step}
                          </li>
                        ))}
                        {post.next_steps.length > 2 && (
                          <li className="text-xs text-muted-foreground">
                            +{post.next_steps.length - 2} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments?.length || 0}
                    </span>
                  </div>

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {post.comments.slice(0, 2).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.author?.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-xs">
                              {comment.author ? getInitials(comment.author.name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {comment.author?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      {post.comments.length > 2 && (
                        <p className="text-xs text-muted-foreground pl-8">
                          +{post.comments.length - 2}개 댓글 더보기
                        </p>
                      )}
                    </div>
                  )}
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
