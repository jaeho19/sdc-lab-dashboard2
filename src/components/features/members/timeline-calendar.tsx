"use client";

import { useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Target,
  Flag,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  CALENDAR_CATEGORY_CONFIG,
  TIMELINE_ITEM_CONFIG,
  MILESTONE_STAGE_LABEL,
  MILESTONE_STAGE_COLORS,
} from "@/lib/constants";
import type { CalendarCategory, MilestoneStage } from "@/types/database.types";

// Types
interface WeeklyGoalItem {
  id: string;
  content: string;
  deadline: string;
  linked_stage: MilestoneStage | null;
  is_completed: boolean;
  projectTitle: string;
  projectId: string;
}

interface MilestoneItem {
  id: string;
  stage: MilestoneStage;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  projectTitle: string;
  projectId: string;
}

interface CalendarEventItem {
  id: string;
  title: string;
  startDatetime: string;
  category: CalendarCategory;
}

interface TimelineCalendarProps {
  memberId: string;
  weeklyGoals: WeeklyGoalItem[];
  milestones: MilestoneItem[];
  calendarEvents: CalendarEventItem[];
}

// Utility functions
function getTwoWeekDates(offset: number = 0): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + offset * 14);

  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getItemsForDate(
  dateStr: string,
  goals: WeeklyGoalItem[],
  milestones: MilestoneItem[],
  events: CalendarEventItem[]
) {
  const matchingGoals = goals.filter(
    (g) => g.deadline === dateStr && !g.is_completed
  );

  const matchingMilestones = milestones.filter((m) => {
    if (!m.startDate || !m.endDate) return false;
    return dateStr >= m.startDate && dateStr <= m.endDate;
  });

  const matchingEvents = events.filter((e) => {
    const eventDate = e.startDatetime.split("T")[0];
    return eventDate === dateStr;
  });

  return {
    goals: matchingGoals,
    milestones: matchingMilestones,
    events: matchingEvents,
  };
}

function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

function formatDateLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day} (${weekday})`;
}

// Component
export function TimelineCalendar({
  memberId,
  weeklyGoals,
  milestones,
  calendarEvents,
}: TimelineCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dates = useMemo(() => getTwoWeekDates(weekOffset), [weekOffset]);

  const dateRange = useMemo(() => {
    if (dates.length === 0) return "";
    const start = dates[0];
    const end = dates[dates.length - 1];
    const formatMonth = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatMonth(start)} ~ ${formatMonth(end)}`;
  }, [dates]);

  const selectedDateStr = selectedDate ? formatDateString(selectedDate) : null;

  const selectedItems = useMemo(() => {
    if (!selectedDateStr) return null;
    return getItemsForDate(
      selectedDateStr,
      weeklyGoals,
      milestones,
      calendarEvents
    );
  }, [selectedDateStr, weeklyGoals, milestones, calendarEvents]);

  const weekdays = useMemo(() => ["일", "월", "화", "수", "목", "금", "토"], []);

  // 완료되지 않은 주간 목표만 필터링 (메모이제이션)
  const pendingGoals = useMemo(
    () => weeklyGoals.filter((g) => !g.is_completed),
    [weeklyGoals]
  );

  // 날짜 선택 핸들러
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // 주차 이동 핸들러
  const handlePrevWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  // 바 위치 계산 (7열 기준, 주 단위) - 마일스톤과 주간 목표 모두 사용
  const getBarStyle = useCallback(
    (
      startDate: string,
      endDate: string,
      weekDates: Date[]
    ): { startCol: number; span: number } | null => {
      const weekStart = formatDateString(weekDates[0]);
      const weekEnd = formatDateString(weekDates[6]);

      // 이 주와 겹치지 않으면 null
      if (endDate < weekStart || startDate > weekEnd) return null;

      // 시작 위치 계산
      let startCol = 0;
      if (startDate > weekStart) {
        for (let i = 0; i < 7; i++) {
          if (formatDateString(weekDates[i]) >= startDate) {
            startCol = i;
            break;
          }
        }
      }

      // 종료 위치 계산
      let endCol = 6;
      if (endDate < weekEnd) {
        for (let i = 6; i >= 0; i--) {
          if (formatDateString(weekDates[i]) <= endDate) {
            endCol = i;
            break;
          }
        }
      }

      return { startCol, span: endCol - startCol + 1 };
    },
    []
  );

  // 주간 목표의 시작일 계산 (마감일 7일 전 또는 오늘 중 늦은 날짜)
  const getGoalStartDate = useCallback((deadline: string): string => {
    const deadlineDate = new Date(deadline);
    const sevenDaysBeforeDeadline = new Date(deadlineDate);
    sevenDaysBeforeDeadline.setDate(deadlineDate.getDate() - 6);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7일 전과 오늘 중 늦은 날짜 사용
    const startDate =
      sevenDaysBeforeDeadline > today ? sevenDaysBeforeDeadline : today;
    // 단, 시작일이 마감일보다 늦으면 마감일 사용
    if (startDate > deadlineDate) {
      return deadline;
    }
    return formatDateString(startDate);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            타임라인
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevWeek}
              disabled={weekOffset <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              {dateRange}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 달력 그리드 (7열 x 2주) */}
        <div>
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                    ? "text-blue-500"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week 1 */}
          <div className="mb-1">
            {/* 날짜 행 */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dates.slice(0, 7).map((date) => {
                const dateStr = formatDateString(date);
                const items = getItemsForDate(
                  dateStr,
                  weeklyGoals,
                  milestones,
                  calendarEvents
                );
                const hasItems =
                  items.goals.length > 0 ||
                  items.milestones.length > 0 ||
                  items.events.length > 0;
                const isTodayDate = isToday(date);
                const isSelected =
                  selectedDate && formatDateString(selectedDate) === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 text-center rounded-md transition-colors min-h-[48px]
                      hover:bg-muted
                      ${isSelected ? "bg-primary/10 ring-2 ring-primary" : ""}
                      ${isTodayDate && !isSelected ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    <span
                      className={`text-sm ${
                        isTodayDate ? "font-bold text-blue-600" : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasItems && (
                      <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                        {items.goals.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                TIMELINE_ITEM_CONFIG.weekly_goal.color,
                            }}
                          />
                        )}
                        {items.events.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Week 1 간트 바 (마일스톤 + 주간 목표) */}
            <div className="space-y-1">
              {/* 마일스톤 바 */}
              {milestones.map((milestone) => {
                if (!milestone.startDate || !milestone.endDate) return null;
                const barStyle = getBarStyle(
                  milestone.startDate,
                  milestone.endDate,
                  dates.slice(0, 7)
                );
                if (!barStyle) return null;

                const stageColor = MILESTONE_STAGE_COLORS[milestone.stage] || MILESTONE_STAGE_COLORS.default;

                return (
                  <Link
                    key={`w1-m-${milestone.id}`}
                    href={`/research/${milestone.projectId}`}
                    className="block"
                  >
                    <div className="grid grid-cols-7">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const isInRange =
                          i >= barStyle.startCol &&
                          i < barStyle.startCol + barStyle.span;
                        const isStart = i === barStyle.startCol;
                        const isEnd = i === barStyle.startCol + barStyle.span - 1;

                        if (!isInRange) return <div key={i} className="h-6" />;

                        return (
                          <div
                            key={i}
                            className={`
                              h-6 flex items-center text-xs text-gray-700
                              hover:opacity-80 transition-opacity cursor-pointer
                              ${isStart ? "rounded-l-md pl-1.5" : ""}
                              ${isEnd ? "rounded-r-md" : ""}
                            `}
                            style={{
                              backgroundColor: stageColor,
                            }}
                            title={`${MILESTONE_STAGE_LABEL[milestone.stage] || milestone.stage} - ${milestone.projectTitle} (${milestone.progress}%)`}
                          >
                            {isStart && (
                              <span className="truncate flex items-center gap-1">
                                <Flag className="h-3 w-3 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                  {MILESTONE_STAGE_LABEL[milestone.stage] ||
                                    milestone.stage}
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}

              {/* 주간 목표 바 */}
              {pendingGoals.map((goal) => {
                const goalStart = getGoalStartDate(goal.deadline);
                const barStyle = getBarStyle(
                  goalStart,
                  goal.deadline,
                  dates.slice(0, 7)
                );
                if (!barStyle) return null;

                // linked_stage에 따라 파스텔 색상 적용, 없으면 기본 색상
                const goalColor = goal.linked_stage
                  ? MILESTONE_STAGE_COLORS[goal.linked_stage] || MILESTONE_STAGE_COLORS.default
                  : MILESTONE_STAGE_COLORS.default;

                return (
                  <Link
                    key={`w1-g-${goal.id}`}
                    href={`/research/${goal.projectId}`}
                    className="block"
                  >
                    <div className="grid grid-cols-7">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const isInRange =
                          i >= barStyle.startCol &&
                          i < barStyle.startCol + barStyle.span;
                        const isStart = i === barStyle.startCol;
                        const isEnd = i === barStyle.startCol + barStyle.span - 1;

                        if (!isInRange) return <div key={i} className="h-6" />;

                        return (
                          <div
                            key={i}
                            className={`
                              h-6 flex items-center text-xs text-gray-700
                              hover:opacity-80 transition-opacity cursor-pointer
                              ${isStart ? "rounded-l-md pl-1.5" : ""}
                              ${isEnd ? "rounded-r-md" : ""}
                            `}
                            style={{
                              backgroundColor: goalColor,
                            }}
                            title={`${goal.content} - ${goal.projectTitle}`}
                          >
                            {isStart && (
                              <span className="truncate flex items-center gap-1">
                                <Target className="h-3 w-3 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                  {goal.content}
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Week 2 */}
          <div className="mt-3 pt-2 border-t">
            {/* 날짜 행 */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dates.slice(7, 14).map((date) => {
                const dateStr = formatDateString(date);
                const items = getItemsForDate(
                  dateStr,
                  weeklyGoals,
                  milestones,
                  calendarEvents
                );
                const hasItems =
                  items.goals.length > 0 ||
                  items.milestones.length > 0 ||
                  items.events.length > 0;
                const isTodayDate = isToday(date);
                const isSelected =
                  selectedDate && formatDateString(selectedDate) === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 text-center rounded-md transition-colors min-h-[48px]
                      hover:bg-muted
                      ${isSelected ? "bg-primary/10 ring-2 ring-primary" : ""}
                      ${isTodayDate && !isSelected ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    <span
                      className={`text-sm ${
                        isTodayDate ? "font-bold text-blue-600" : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasItems && (
                      <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                        {items.goals.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                TIMELINE_ITEM_CONFIG.weekly_goal.color,
                            }}
                          />
                        )}
                        {items.events.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Week 2 간트 바 (마일스톤 + 주간 목표) */}
            <div className="space-y-1">
              {/* 마일스톤 바 */}
              {milestones.map((milestone) => {
                if (!milestone.startDate || !milestone.endDate) return null;
                const barStyle = getBarStyle(
                  milestone.startDate,
                  milestone.endDate,
                  dates.slice(7, 14)
                );
                if (!barStyle) return null;

                const stageColor = MILESTONE_STAGE_COLORS[milestone.stage] || MILESTONE_STAGE_COLORS.default;

                return (
                  <Link
                    key={`w2-m-${milestone.id}`}
                    href={`/research/${milestone.projectId}`}
                    className="block"
                  >
                    <div className="grid grid-cols-7">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const isInRange =
                          i >= barStyle.startCol &&
                          i < barStyle.startCol + barStyle.span;
                        const isStart = i === barStyle.startCol;
                        const isEnd = i === barStyle.startCol + barStyle.span - 1;

                        if (!isInRange) return <div key={i} className="h-6" />;

                        return (
                          <div
                            key={i}
                            className={`
                              h-6 flex items-center text-xs text-gray-700
                              hover:opacity-80 transition-opacity cursor-pointer
                              ${isStart ? "rounded-l-md pl-1.5" : ""}
                              ${isEnd ? "rounded-r-md" : ""}
                            `}
                            style={{
                              backgroundColor: stageColor,
                            }}
                            title={`${MILESTONE_STAGE_LABEL[milestone.stage] || milestone.stage} - ${milestone.projectTitle} (${milestone.progress}%)`}
                          >
                            {isStart && (
                              <span className="truncate flex items-center gap-1">
                                <Flag className="h-3 w-3 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                  {MILESTONE_STAGE_LABEL[milestone.stage] ||
                                    milestone.stage}
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}

              {/* 주간 목표 바 */}
              {pendingGoals.map((goal) => {
                const goalStart = getGoalStartDate(goal.deadline);
                const barStyle = getBarStyle(
                  goalStart,
                  goal.deadline,
                  dates.slice(7, 14)
                );
                if (!barStyle) return null;

                // linked_stage에 따라 파스텔 색상 적용, 없으면 기본 색상
                const goalColor = goal.linked_stage
                  ? MILESTONE_STAGE_COLORS[goal.linked_stage] || MILESTONE_STAGE_COLORS.default
                  : MILESTONE_STAGE_COLORS.default;

                return (
                  <Link
                    key={`w2-g-${goal.id}`}
                    href={`/research/${goal.projectId}`}
                    className="block"
                  >
                    <div className="grid grid-cols-7">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const isInRange =
                          i >= barStyle.startCol &&
                          i < barStyle.startCol + barStyle.span;
                        const isStart = i === barStyle.startCol;
                        const isEnd = i === barStyle.startCol + barStyle.span - 1;

                        if (!isInRange) return <div key={i} className="h-6" />;

                        return (
                          <div
                            key={i}
                            className={`
                              h-6 flex items-center text-xs text-gray-700
                              hover:opacity-80 transition-opacity cursor-pointer
                              ${isStart ? "rounded-l-md pl-1.5" : ""}
                              ${isEnd ? "rounded-r-md" : ""}
                            `}
                            style={{
                              backgroundColor: goalColor,
                            }}
                            title={`${goal.content} - ${goal.projectTitle}`}
                          >
                            {isStart && (
                              <span className="truncate flex items-center gap-1">
                                <Target className="h-3 w-3 shrink-0" />
                                <span className="truncate text-[11px] font-medium">
                                  {goal.content}
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Legend - 카테고리별 색상 */}
          <div className="mt-3 pt-2 border-t">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">카테고리:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.literature_review }} />
                <span>문헌조사</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.methodology }} />
                <span>방법론</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.data_collection }} />
                <span>데이터수집</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.analysis }} />
                <span>분석</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.draft_writing }} />
                <span>초고작성</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: MILESTONE_STAGE_COLORS.submission }} />
                <span>투고</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>일정</span>
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 날짜 상세 패널 (아래에 표시) */}
        {selectedDate && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDateLabel(selectedDate)}
            </h4>
            <div className="space-y-2">
              {/* Weekly Goals */}
              {selectedItems?.goals.map((goal) => (
                <Link
                  key={goal.id}
                  href={`/research/${goal.projectId}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Target
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: TIMELINE_ITEM_CONFIG.weekly_goal.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{goal.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.projectTitle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Milestones */}
              {selectedItems?.milestones.map((milestone) => (
                <Link
                  key={milestone.id}
                  href={`/research/${milestone.projectId}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Flag
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: TIMELINE_ITEM_CONFIG.milestone.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {MILESTONE_STAGE_LABEL[milestone.stage] ||
                            milestone.stage}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {milestone.progress}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {milestone.projectTitle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Calendar Events */}
              {selectedItems?.events.map((event) => {
                const config = CALENDAR_CATEGORY_CONFIG[event.category];
                return (
                  <Link
                    key={event.id}
                    href="/calendar"
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Calendar
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: config?.color || "#10b981" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1"
                          style={{
                            borderColor: config?.color,
                            color: config?.color,
                          }}
                        >
                          {config?.label || event.category}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Empty state */}
              {selectedItems &&
                selectedItems.goals.length === 0 &&
                selectedItems.milestones.length === 0 &&
                selectedItems.events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    이 날짜에 등록된 항목이 없습니다.
                  </p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
