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
import { Mail, GraduationCap, Calendar, FileText, Sparkles, Pencil, Plus, Clock, Plane, BookOpen as BookOpenIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Database } from "@/types/database.types";

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

  if (user) {
    const { data: currentMember } = await supabase
      .from("members")
      .select("id, position")
      .eq("user_id", user.id)
      .single() as { data: { id: string; position: string } | null };

    if (currentMember) {
      const isAdmin = currentMember.position === "professor";
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
      research_projects (
        id,
        title,
        status,
        overall_progress
      )
    `
    )
    .eq("member_id", id);

  // 개별 캘린더 이벤트 조회 (해당 멤버의 일정)
  const { data: memberEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("member_id", id)
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(10);

  // 멘토링 기록 조회 (해당 연구원이 대상인 멘토링)
  const { data: mentoringPosts } = await supabase
    .from("mentoring_posts")
    .select("*")
    .eq("target_member_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const projectList = (projectMembers || []) as Array<{
    role: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
    } | null;
  }>;

  const eventList = (memberEvents || []) as Array<{
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    all_day: boolean;
    category: string;
  }>;

  const mentoringList = (mentoringPosts || []) as Array<{
    id: string;
    content: string;
    meeting_date: string | null;
    created_at: string;
  }>;

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
                {canEdit && (
                  <Link href={`/members/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-2" />
                      정보 수정
                    </Button>
                  </Link>
                )}
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectList.map((pm, index) => {
                const project = pm.research_projects;
                if (!project) return null;
                return (
                  <Link
                    key={index}
                    href={`/research/${project.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate flex-1">
                          {project.title}
                        </h4>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {getRoleLabel(pm.role)}
                        </Badge>
                      </div>
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
                    </div>
                  </Link>
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

        {/* 개별 캘린더 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              개별 일정
            </CardTitle>
            {canEdit && (
              <Link href={`/calendar?member=${id}`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  일정 추가
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eventList.map((event) => {
                const getCategoryIcon = (category: string) => {
                  switch (category) {
                    case "lab_meeting":
                    case "seminar":
                      return <Users className="h-4 w-4" />;
                    case "vacation":
                      return <Plane className="h-4 w-4" />;
                    case "study":
                      return <BookOpenIcon className="h-4 w-4" />;
                    default:
                      return <Clock className="h-4 w-4" />;
                  }
                };
                const getCategoryLabel = (category: string) => {
                  const labels: Record<string, string> = {
                    lab_meeting: "미팅",
                    conference: "학회",
                    social: "친목",
                    deadline: "마감",
                    seminar: "세미나",
                    study: "수업",
                    field_trip: "출장",
                    vacation: "휴가",
                  };
                  return labels[category] || category;
                };
                const formatEventDate = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
                  const weekday = weekdays[date.getDay()];
                  return `${month}/${day} (${weekday})`;
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="text-muted-foreground">
                      {getCategoryIcon(event.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatEventDate(event.start_date)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {getCategoryLabel(event.category)}
                    </Badge>
                  </div>
                );
              })}
              {eventList.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  예정된 일정이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 멘토링 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 멘토링 기록</CardTitle>
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
