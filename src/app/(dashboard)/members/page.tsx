import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getPositionLabel, filterFullTimeMembersForGantt } from "@/lib/utils";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import { FullTimeMembersGantt } from "@/components/members/full-time-members-gantt";

type Member = Database["public"]["Tables"]["members"]["Row"];
type MemberPosition = Database["public"]["Tables"]["members"]["Row"]["position"];

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

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: membersData } = await supabase
    .from("members")
    .select("*")
    .eq("status", "active")
    .order("position", { ascending: true });

  const members = (membersData || []) as Member[];

  // 교수 분리
  const professors = members.filter(m => m.position === "professor");

  // 풀타임/파트타임 분리 (교수 제외)
  const fullTimeMembers = members.filter(m => m.employment_type === "full-time" && m.position !== "professor");
  const partTimeMembers = members.filter(m => m.employment_type === "part-time");

  // 정렬 함수: globalNameOrder를 우선 적용하여 직책과 관계없이 원하는 순서로 정렬
  const sortByPosition = (a: Member, b: Member) => {
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

    return a.name.localeCompare(b.name, 'ko');
  };

  // 직책별 그룹화 함수
  const groupByPosition = (memberList: Member[]) => {
    const sorted = [...memberList].sort(sortByPosition);
    const grouped = sorted.reduce((acc, member) => {
      const position = member.position;
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(member);
      return acc;
    }, {} as Record<string, Member[]>);

    // 그룹 정렬: 각 그룹의 첫 번째 멤버의 globalNameOrder 기준
    return Object.entries(grouped).sort(([, membersA], [, membersB]) => {
      const firstA = membersA[0];
      const firstB = membersB[0];
      const orderA = globalNameOrder[firstA?.name] ?? 999;
      const orderB = globalNameOrder[firstB?.name] ?? 999;
      return orderA - orderB;
    });
  };

  const fullTimeGroups = groupByPosition(fullTimeMembers);
  const partTimeGroups = groupByPosition(partTimeMembers);

  // 간트차트용 데이터 변환
  const ganttMembers = filterFullTimeMembersForGantt(members);

  function getPositionBadgeVariant(position: string): "professor" | "post-doc" | "post_doc" | "phd" | "researcher" | "ms" | "default" {
    const variants: Record<string, "professor" | "post-doc" | "phd" | "researcher" | "ms"> = {
      professor: "professor",
      "post-doc": "post-doc",
      post_doc: "post-doc",
      phd: "phd",
      researcher: "researcher",
      ms: "ms",
    };
    return variants[position] || "default";
  }

  const renderMemberCard = (member: Member) => (
    <Link key={member.id} href={`/members/${member.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-br from-white to-slate-50">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3 md:mb-4 ring-2 ring-offset-2 ring-slate-200">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-base md:text-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-base md:text-lg text-slate-800">{member.name}</h3>
            <p className="text-xs md:text-sm text-slate-500 mb-2 md:mb-3 truncate max-w-full">{member.email}</p>
            <Badge variant={getPositionBadgeVariant(member.position)}>
              {getPositionLabel(member.position)}
            </Badge>
            {member.enrollment_year && (
              <p className="text-xs text-slate-400 mt-2 md:mt-3">
                {member.enrollment_year}년 입학
                {member.expected_graduation_year &&
                  ` · ${member.expected_graduation_year}년 졸업예정`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderPositionGroup = (position: string, positionMembers: Member[]) => (
    <div key={position} className="space-y-3 md:space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={getPositionBadgeVariant(position)}>
          {getPositionLabel(position)}
        </Badge>
        <span className="text-xs md:text-sm text-muted-foreground">
          {positionMembers.length}명
        </span>
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {positionMembers.map(renderMemberCard)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          SDC Lab 연구원 ({members.length}명)
        </p>
      </div>

      {/* Full-time Members Timeline (Gantt Chart) */}
      {ganttMembers.length > 0 && (
        <FullTimeMembersGantt members={ganttMembers} showTodayLine />
      )}

      {/* Professor Section */}
      {professors.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-blue-800 to-blue-900 rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold text-slate-700">Professor</h2>
          </div>
          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pl-2 md:pl-4">
            {professors.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Full-Time Section */}
      {fullTimeMembers.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold text-slate-700">Full-Time</h2>
            <span className="text-xs md:text-sm text-muted-foreground">
              {fullTimeMembers.length}명
            </span>
          </div>
          <div className="space-y-4 md:space-y-6 pl-2 md:pl-4">
            {fullTimeGroups.map(([position, positionMembers]) =>
              renderPositionGroup(position, positionMembers)
            )}
          </div>
        </div>
      )}

      {/* Part-Time Section */}
      {partTimeMembers.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold text-slate-700">Part-Time</h2>
            <span className="text-xs md:text-sm text-muted-foreground">
              {partTimeMembers.length}명
            </span>
          </div>
          <div className="space-y-4 md:space-y-6 pl-2 md:pl-4">
            {partTimeGroups.map(([position, positionMembers]) =>
              renderPositionGroup(position, positionMembers)
            )}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              등록된 연구원이 없습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
