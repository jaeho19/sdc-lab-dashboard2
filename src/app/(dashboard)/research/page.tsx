import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getPositionLabel, formatDate } from "@/lib/utils";
import { Plus, Calendar, Target, ChevronRight } from "lucide-react";
import Link from "next/link";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 직책별 정렬 순서
const positionOrder: Record<string, number> = {
  professor: 1,
  "post-doc": 2,
  post_doc: 2,
  phd: 3,
  researcher: 4,
  ms: 5,
};

// 전체 정렬에서 특정 멤버의 순서를 강제 지정 (직책 무시)
// 값이 작을수록 먼저 표시됨
const globalNameOrder: Record<string, number> = {
  "강성익": 10,
  "오재인": 11,
  "이지윤": 20,
  "김은솔": 21,
  "김주현": 22,  // 김은솔(21) 다음, 이다연(23) 전
  "이다연": 23,
  "김가인": 30,
  "배성훈": 31,
  "이은진": 32,
  "최희진": 33,
};

export default async function ResearchPage() {
  const supabase = await createClient();

  // 연구원 및 프로젝트 조회
  const { data: members } = await supabase
    .from("members")
    .select(`
      id,
      name,
      position,
      employment_type,
      avatar_url,
      project_members (
        role,
        project:research_projects (
          id,
          title,
          status,
          overall_progress,
          target_date,
          target_journal,
          category
        )
      )
    `)
    .eq("status", "active")
    .neq("position", "professor");

  type Project = {
    id: string;
    title: string;
    status: string;
    overall_progress: number;
    target_date: string | null;
    target_journal: string | null;
    category: string;
  };

  type MemberWithProjects = {
    id: string;
    name: string;
    position: string;
    employment_type: string;
    avatar_url: string | null;
    project_members: Array<{
      role: string;
      project: Project | null;
    }>;
  };

  const memberList = (members || []) as MemberWithProjects[];

  // 정렬 함수: globalNameOrder를 우선 적용하여 직책과 관계없이 원하는 순서로 정렬
  const sortByPosition = (a: MemberWithProjects, b: MemberWithProjects) => {
    const nameOrderA = globalNameOrder[a.name];
    const nameOrderB = globalNameOrder[b.name];

    // 둘 다 globalNameOrder에 있으면 그 순서대로
    if (nameOrderA !== undefined && nameOrderB !== undefined) {
      return nameOrderA - nameOrderB;
    }

    // 한쪽만 globalNameOrder에 있으면 그쪽 우선
    if (nameOrderA !== undefined) return -1;
    if (nameOrderB !== undefined) return 1;

    // 둘 다 없으면 직책순 -> 이름순
    const posA = positionOrder[a.position] || 99;
    const posB = positionOrder[b.position] || 99;
    if (posA !== posB) return posA - posB;

    return a.name.localeCompare(b.name, "ko");
  };

  // 고용 형태별 그룹화 및 정렬
  const fullTimeMembers = memberList
    .filter((m) => m.employment_type === "full-time")
    .sort(sortByPosition);
  const partTimeMembers = memberList
    .filter((m) => m.employment_type === "part-time")
    .sort(sortByPosition);

  // 연구원의 모든 first_author 프로젝트 가져오기
  function getProjects(member: MemberWithProjects): Project[] {
    return member.project_members
      .filter((pm) => pm.role === "first_author" && pm.project)
      .map((pm) => pm.project!)
      .sort((a, b) => b.overall_progress - a.overall_progress);
  }

  // Position 뱃지 색상
  function getPositionBadgeClass(position: string) {
    const classes: Record<string, string> = {
      post_doc: "bg-amber-500 text-white",
      phd: "bg-blue-500 text-white",
      researcher: "bg-purple-500 text-white",
      ms: "bg-teal-500 text-white",
    };
    return classes[position] || "bg-gray-500 text-white";
  }

  // 상태 색상
  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      preparing: "bg-gray-100 text-gray-700",
      submitting: "bg-blue-100 text-blue-700",
      under_review: "bg-yellow-100 text-yellow-700",
      revision: "bg-orange-100 text-orange-700",
      accepted: "bg-green-100 text-green-700",
      published: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  // 상태 라벨
  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      preparing: "준비중",
      submitting: "투고중",
      under_review: "심사중",
      revision: "수정중",
      accepted: "승인",
      published: "출판",
    };
    return labels[status] || status;
  }

  // D-day 계산
  function getDday(targetDate: string | null) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: `D+${Math.abs(diff)}`, color: "text-red-500" };
    if (diff === 0) return { text: "D-Day", color: "text-red-500" };
    if (diff <= 7) return { text: `D-${diff}`, color: "text-orange-500" };
    if (diff <= 30) return { text: `D-${diff}`, color: "text-yellow-600" };
    return { text: `D-${diff}`, color: "text-muted-foreground" };
  }

  // 연구원 카드 컴포넌트
  function ResearcherCard({ member }: { member: MemberWithProjects }) {
    const projects = getProjects(member);
    const totalProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.overall_progress, 0) / projects.length)
      : 0;

    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        {/* 헤더: 연구원 정보 */}
        <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href={`/members/${member.id}`}>
              <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-offset-2 ring-primary/10 hover:ring-primary/30 transition-all">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="bg-sidebar-primary text-white text-sm md:text-base">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/members/${member.id}`}>
                  <h3 className="font-semibold hover:text-primary transition-colors text-sm md:text-base">
                    {member.name}
                  </h3>
                </Link>
                <Badge className={`${getPositionBadgeClass(member.position)} text-xs`}>
                  {getPositionLabel(member.position)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs md:text-sm text-muted-foreground">
                  {projects.length}개 연구 진행중
                </span>
                {projects.length > 0 && (
                  <>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="text-xs md:text-sm font-medium hidden sm:inline">평균 {totalProgress}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 본문: 프로젝트 목록 */}
        <CardContent className="pt-0 p-4 md:p-6 md:pt-0">
          {projects.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {projects.map((project) => {
                const dday = getDday(project.target_date);
                return (
                  <Link
                    key={project.id}
                    href={`/research/${project.id}`}
                    className="block"
                  >
                    <div className="p-2 md:p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-all group">
                      {/* 프로젝트 제목 및 상태 */}
                      <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                        <h4 className="text-xs md:text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors flex-1">
                          {project.title}
                        </h4>
                        <Badge className={`${getStatusColor(project.status)} text-xs shrink-0`}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>

                      {/* 진행률 */}
                      <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                        <Progress value={project.overall_progress} className="h-1.5 md:h-2 flex-1" />
                        <span className="text-xs font-semibold w-10 text-right">
                          {project.overall_progress}%
                        </span>
                      </div>

                      {/* 기한 및 저널 정보 */}
                      <div className="flex items-center gap-2 md:gap-3 text-xs text-muted-foreground flex-wrap">
                        {project.target_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">{formatDate(project.target_date)}</span>
                            {dday && (
                              <span className={`font-semibold ${dday.color}`}>
                                {dday.text}
                              </span>
                            )}
                          </div>
                        )}
                        {project.target_journal && (
                          <div className="flex items-center gap-1 hidden md:flex">
                            <Target className="h-3 w-3" />
                            <span className="truncate max-w-[100px] lg:max-w-[120px]">
                              {project.target_journal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-3 md:py-4 text-center text-xs md:text-sm text-muted-foreground bg-muted/30 rounded-lg">
              진행 중인 연구가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 파트타임 연구원 카드 (간소화)
  function PartTimeCard({ member }: { member: MemberWithProjects }) {
    const projects = getProjects(member);

    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="py-3 md:py-4 px-3 md:px-6">
          <Link href={`/members/${member.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-sidebar-primary text-white text-xs md:text-sm">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium hover:text-primary transition-colors text-sm md:text-base">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getPositionLabel(member.position)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {projects.length > 0 ? `${projects.length}개 연구` : "연구 없음"}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Research</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            연구원별 연구 프로젝트 현황
          </p>
        </div>
        <Link href="/research/new">
          <Button size="sm" className="md:h-10 md:px-4 md:text-base">
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      {/* FULL-TIME Section */}
      <section>
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm md:text-lg font-semibold text-muted-foreground px-2 md:px-4">
            FULL-TIME
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {fullTimeMembers.map((member) => (
            <ResearcherCard key={member.id} member={member} />
          ))}
        </div>

        {fullTimeMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm md:text-base">
            풀타임 연구원이 없습니다.
          </div>
        )}
      </section>

      {/* PART-TIME Section */}
      {partTimeMembers.length > 0 && (
        <section>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="h-px flex-1 bg-border" />
            <h2 className="text-sm md:text-lg font-semibold text-muted-foreground px-2 md:px-4">
              PART-TIME
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partTimeMembers.map((member) => (
              <PartTimeCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
