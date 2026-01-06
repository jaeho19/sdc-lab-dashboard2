"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Target, Calendar } from "lucide-react";
import { getInitials, getCalendarCategoryLabel } from "@/lib/utils";
import Link from "next/link";

export interface UnifiedDeadlineItem {
  id: string;
  type: "goal" | "event";
  title: string;
  date: string;
  memberName: string;
  memberAvatarUrl?: string | null;
  projectId?: string;
  projectTitle?: string;
  category?: string;
  isAllDay?: boolean;
  memberId?: string;  // 추가: 일정 클릭 시 멤버 페이지로 이동
  isCompleted?: boolean;  // 추가: 목표 완료 여부
}

interface UnifiedDeadlineViewProps {
  items: UnifiedDeadlineItem[];
}

function getDeadlineStatus(
  date: string,
  type: "goal" | "event",
  isCompleted?: boolean
): "overdue" | "today" | "soon" | "normal" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 목표가 완료되지 않았고 기한이 지났으면 overdue
  if (type === "goal" && !isCompleted && diffDays < 0) return "overdue";

  // 일정은 오늘/미래만 표시되므로 overdue 없음
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "normal";
}

function formatDate(dateStr: string): { month: string; day: number; weekday: string } {
  const date = new Date(dateStr);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return {
    month: `${date.getMonth() + 1}월`,
    day: date.getDate(),
    weekday: weekdays[date.getDay()],
  };
}

export function UnifiedDeadlineView({ items }: UnifiedDeadlineViewProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            다가오는 마감일
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <p className="text-center text-muted-foreground py-4">
            예정된 마감일이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Clock className="h-4 w-4 md:h-5 md:w-5" />
          다가오는 마감일
          <Badge variant="secondary" className="ml-auto text-xs">
            {items.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
          {items.map((item) => {
            const status = getDeadlineStatus(item.date, item.type, item.isCompleted);
            const { month, day, weekday } = formatDate(item.date);

            const isOverdue = status === "overdue" && item.type === "goal";

            const statusColors = {
              overdue: "bg-red-100 text-red-600",
              today: "bg-orange-100 text-orange-600",
              soon: "bg-yellow-100 text-yellow-600",
              normal: "bg-primary/10 text-primary",
            };

            const content = (
              <div
                className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                  isOverdue ? "border-red-300 bg-red-50/50" : ""
                }`}
              >
                {/* Date Box */}
                <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg flex flex-col items-center justify-center ${statusColors[status]}`}>
                  <span className="text-[10px] md:text-xs font-medium">{month}</span>
                  <span className="text-lg md:text-xl font-bold">{day}</span>
                  <span className="text-[9px] md:text-[10px]">({weekday})</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 md:h-6 md:w-6">
                      <AvatarImage src={item.memberAvatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] md:text-xs">
                        {getInitials(item.memberName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs md:text-sm font-medium truncate">
                      {item.memberName}
                    </span>
                    {/* 지연 알림 배지 */}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        지연됨
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm md:text-base font-medium truncate ${
                    isOverdue ? "text-red-700" : ""
                  }`}>
                    {item.title}
                  </p>
                  {item.projectTitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.projectTitle}
                    </p>
                  )}
                </div>

                {/* Type Badge */}
                <div className="flex-shrink-0">
                  {item.type === "goal" ? (
                    <Badge
                      variant={isOverdue ? "destructive" : "default"}
                      className="text-xs"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      목표
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.category ? getCalendarCategoryLabel(item.category) : "일정"}
                    </Badge>
                  )}
                </div>
              </div>
            );

            // Wrap in Link based on type
            if (item.type === "goal" && item.projectId) {
              return (
                <Link key={item.id} href={`/research/${item.projectId}`} className="block">
                  {content}
                </Link>
              );
            }

            if (item.type === "event") {
              // event에 memberId가 있으면 멤버 페이지로, 없으면 캘린더로
              const eventLink = item.memberId
                ? `/members/${item.memberId}`
                : "/calendar";
              return (
                <Link key={item.id} href={eventLink} className="block">
                  {content}
                </Link>
              );
            }

            return <div key={item.id}>{content}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
