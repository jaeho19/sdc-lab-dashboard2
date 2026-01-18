"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getPositionLabel, type GanttMemberData } from "@/lib/utils";
import Link from "next/link";

// 직급별 색상 설정 (파스텔 톤, 구분 명확)
const POSITION_GANTT_COLORS = {
  ms: {
    bg: "bg-blue-400",       // 석사과정: 밝은 파랑
    hex: "#60a5fa",
    label: "석사과정",
  },
  phd: {
    bg: "bg-teal-500",       // 박사과정: 틸 (청록)
    hex: "#14b8a6",
    label: "박사과정",
  },
  post_doc: {
    bg: "bg-purple-400",     // 포닥: 보라
    hex: "#c084fc",
    label: "포닥",
  },
  researcher: {
    bg: "bg-amber-400",      // 연구원: 앰버
    hex: "#fbbf24",
    label: "연구원",
  },
  professor: {
    bg: "bg-slate-600",      // 교수: 슬레이트
    hex: "#475569",
    label: "교수",
  },
} as const;

// 직급 우선순위 (낮을수록 상단에 표시)
const POSITION_PRIORITY: Record<string, number> = {
  post_doc: 0,    // 포닥 - 최상단
  phd: 1,         // 박사과정
  researcher: 2,  // 연구원
  ms: 3,          // 석사과정 - 최하단
};

interface FullTimeMembersGanttProps {
  members: GanttMemberData[];
  showTodayLine?: boolean;
}

export function FullTimeMembersGantt({
  members,
  showTodayLine = true,
}: FullTimeMembersGanttProps) {
  // 차트 범위 계산 (가장 빠른 시작일 ~ 가장 늦은 종료일)
  const { startYear, endYear, totalMonths, todayPosition } = useMemo(() => {
    if (members.length === 0) {
      const now = new Date();
      return {
        startYear: now.getFullYear() - 1,
        endYear: now.getFullYear() + 2,
        totalMonths: 36,
        todayPosition: 50,
      };
    }

    const allDates = members.flatMap(m => [new Date(m.startDate), new Date(m.endDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // 여유 공간 추가 (앞뒤로 6개월씩)
    const chartStart = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 6) * 6, 1);
    const chartEnd = new Date(maxDate.getFullYear(), Math.ceil((maxDate.getMonth() + 1) / 6) * 6, 0);

    const sYear = chartStart.getFullYear();
    const eYear = chartEnd.getFullYear();
    const months = (eYear - sYear) * 12 + (chartEnd.getMonth() - chartStart.getMonth()) + 1;

    const now = new Date();
    const nowMonths = (now.getFullYear() - sYear) * 12 + now.getMonth();
    const position = (nowMonths / months) * 100;

    return {
      startYear: sYear,
      endYear: eYear,
      totalMonths: months,
      todayPosition: Math.max(0, Math.min(100, position)),
    };
  }, [members]);

  // 연도 마커 생성
  const yearMarkers = useMemo(() => {
    const markers = [];
    for (let year = startYear; year <= endYear; year++) {
      const monthsFromStart = (year - startYear) * 12;
      const position = (monthsFromStart / totalMonths) * 100;
      markers.push({ year, position });
    }
    return markers;
  }, [startYear, endYear, totalMonths]);

  // 학기 마커 생성 (1학기: 3월, 2학기: 9월)
  const semesterMarkers = useMemo(() => {
    const markers = [];
    for (let year = startYear; year <= endYear; year++) {
      // 1학기 (3월)
      const sem1Months = (year - startYear) * 12 + 2; // 3월 = 인덱스 2
      if (sem1Months >= 0 && sem1Months < totalMonths) {
        markers.push({
          label: `${year} 1학기`,
          position: (sem1Months / totalMonths) * 100,
        });
      }
      // 2학기 (9월)
      const sem2Months = (year - startYear) * 12 + 8; // 9월 = 인덱스 8
      if (sem2Months >= 0 && sem2Months < totalMonths) {
        markers.push({
          label: `${year} 2학기`,
          position: (sem2Months / totalMonths) * 100,
        });
      }
    }
    return markers;
  }, [startYear, endYear, totalMonths]);

  // 멤버별 바 위치 계산 (직급순 정렬 적용)
  const memberBars = useMemo(() => {
    // 직급순 정렬 후 같은 직급 내에서는 이름순 정렬
    const sortedMembers = [...members].sort((a, b) => {
      const priorityA = POSITION_PRIORITY[a.position] ?? 99;
      const priorityB = POSITION_PRIORITY[b.position] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // 같은 직급 내에서는 이름순 정렬
      return a.name.localeCompare(b.name, "ko");
    });

    return sortedMembers.map(member => {
      const startDate = new Date(member.startDate);
      const endDate = new Date(member.endDate);
      const startMonths =
        (startDate.getFullYear() - startYear) * 12 +
        startDate.getMonth();
      const endMonths =
        (endDate.getFullYear() - startYear) * 12 +
        endDate.getMonth();

      const left = (startMonths / totalMonths) * 100;
      const width = ((endMonths - startMonths + 1) / totalMonths) * 100;

      return {
        ...member,
        startDateObj: startDate,
        endDateObj: endDate,
        left: Math.max(0, left),
        width: Math.min(100 - left, width),
      };
    });
  }, [members, startYear, totalMonths]);

  // 직급별 색상 반환
  const getPositionColor = (position: string) => {
    const config = POSITION_GANTT_COLORS[position as keyof typeof POSITION_GANTT_COLORS];
    return config?.bg || "bg-slate-500";
  };

  // 졸업예정인 경우 테두리 추가를 위한 상태 확인
  const getStatusBorderClass = (status: GanttMemberData["status"]) => {
    if (status === "graduating_soon") {
      return "ring-2 ring-amber-400 ring-offset-1";
    }
    if (status === "graduated") {
      return "opacity-60";
    }
    return "";
  };

  const getStatusBadge = (status: GanttMemberData["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-[10px] px-1.5 py-0">재학</Badge>;
      case "graduating_soon":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 bg-amber-500">졸업예정</Badge>;
      case "graduated":
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">졸업</Badge>;
      default:
        return null;
    }
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Full-time Members Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            표시할 풀타임 멤버가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg">Full-time Members Timeline</CardTitle>
          {/* 직급별 색상 범례 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="font-medium text-slate-600">직급별:</span>
            {Object.entries(POSITION_GANTT_COLORS)
              .filter(([key]) => key !== "professor") // 교수 제외
              .map(([key, config]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={cn("w-3 h-3 rounded", config.bg)} />
                  <span>{config.label}</span>
                </span>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* 연도/학기 헤더 */}
          <div className="relative h-8 mb-2 border-b border-slate-200">
            {yearMarkers.map(({ year, position }) => (
              <div
                key={year}
                className="absolute top-0 h-full border-l border-slate-300"
                style={{ left: `${position}%` }}
              >
                <span className="absolute -top-0.5 left-1 text-xs font-semibold text-slate-600">
                  {year}
                </span>
              </div>
            ))}
          </div>

          {/* 학기 서브헤더 */}
          <div className="relative h-5 mb-3 border-b border-slate-100">
            {semesterMarkers.map(({ label, position }, idx) => (
              <div
                key={idx}
                className="absolute top-0 text-[10px] text-slate-400"
                style={{ left: `${position}%` }}
              >
                {label.split(" ")[1]}
              </div>
            ))}
          </div>

          {/* 오늘 표시선 */}
          {showTodayLine && todayPosition >= 0 && todayPosition <= 100 && (
            <div
              className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium whitespace-nowrap">
                Today
              </div>
            </div>
          )}

          {/* 멤버별 간트 바 */}
          <div className="space-y-2">
            {memberBars.map(member => (
              <div key={member.id} className="flex items-center gap-2 h-8">
                {/* 멤버 이름 (왼쪽 고정) */}
                <div className="w-24 flex-shrink-0 flex items-center gap-1">
                  <Link
                    href={`/members/${member.id}`}
                    className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline truncate"
                  >
                    {member.name}
                  </Link>
                </div>

                {/* 간트 바 영역 */}
                <div className="flex-1 relative h-6 bg-slate-50 rounded">
                  {/* 연도 구분선 (배경) */}
                  {yearMarkers.map(({ year, position }) => (
                    <div
                      key={year}
                      className="absolute top-0 h-full border-l border-slate-200"
                      style={{ left: `${position}%` }}
                    />
                  ))}

                  {/* 멤버 바 - 직급별 색상 적용 */}
                  <div
                    className={cn(
                      "absolute top-1 h-4 rounded-sm transition-all hover:brightness-110 cursor-pointer",
                      getPositionColor(member.position),
                      getStatusBorderClass(member.status)
                    )}
                    style={{
                      left: `${member.left}%`,
                      width: `${member.width}%`,
                      minWidth: "4px",
                    }}
                    title={`${member.name} (${getPositionLabel(member.position)})\n입학: ${member.startDateObj.toLocaleDateString("ko-KR")}\n졸업예정: ${member.endDateObj.toLocaleDateString("ko-KR")}`}
                  >
                    {/* 바 안에 직위 표시 (바가 충분히 넓을 때만) */}
                    {member.width > 8 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium truncate px-1">
                        {getPositionLabel(member.position)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 상태 뱃지 */}
                <div className="w-16 flex-shrink-0 flex justify-end">
                  {getStatusBadge(member.status)}
                </div>
              </div>
            ))}
          </div>

          {/* 통계 (하단) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium">총 {members.length}명</span>
              <span className="text-slate-300">|</span>
              <span>석사 {members.filter(m => m.position === "ms").length}명</span>
              <span>박사 {members.filter(m => m.position === "phd").length}명</span>
              <span>포닥 {members.filter(m => m.position === "post_doc").length}명</span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600">
                졸업예정 {members.filter(m => m.status === "graduating_soon").length}명
              </span>
            </div>
            <span className="text-slate-400">
              {startYear}년 ~ {endYear}년
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
