"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getPositionLabel, type GanttMemberData } from "@/lib/utils";
import Link from "next/link";

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

  // 멤버별 바 위치 계산
  const memberBars = useMemo(() => {
    return members.map(member => {
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

  const getStatusColor = (status: GanttMemberData["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-500";
      case "graduating_soon":
        return "bg-amber-500";
      case "graduated":
        return "bg-slate-400";
      default:
        return "bg-blue-500";
    }
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Full-time Members Timeline</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500" /> 재학
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500" /> 졸업예정 (6개월 내)
            </span>
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

                  {/* 멤버 바 */}
                  <div
                    className={cn(
                      "absolute top-1 h-4 rounded-sm transition-all hover:brightness-110 cursor-pointer",
                      getStatusColor(member.status)
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

          {/* 범례 (하단) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              총 {members.length}명 |
              재학 {members.filter(m => m.status === "active").length}명 ·
              졸업예정 {members.filter(m => m.status === "graduating_soon").length}명
            </span>
            <span>
              {startYear}년 ~ {endYear}년
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
