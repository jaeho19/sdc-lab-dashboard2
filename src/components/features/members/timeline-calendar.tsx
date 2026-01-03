"use client";

import { useState, useMemo } from "react";
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

// 간트 바 위치 계산
function calculateBarPosition(
  startDate: string,
  endDate: string,
  dates: Date[]
): { startCol: number; span: number } | null {
  const rangeStart = formatDateString(dates[0]);
  const rangeEnd = formatDateString(dates[dates.length - 1]);

  // 범위 밖이면 null
  if (endDate < rangeStart || startDate > rangeEnd) return null;

  // 시작 위치 계산
  let startCol = 0;
  for (let i = 0; i < dates.length; i++) {
    if (formatDateString(dates[i]) >= startDate) {
      startCol = i;
      break;
    }
  }

  // 종료 위치 계산
  let endCol = dates.length - 1;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (formatDateString(dates[i]) <= endDate) {
      endCol = i;
      break;
    }
  }

  const span = endCol - startCol + 1;
  return { startCol, span };
}

// 단일 날짜 위치 계산
function calculatePointPosition(
  targetDate: string,
  dates: Date[]
): number | null {
  for (let i = 0; i < dates.length; i++) {
    if (formatDateString(dates[i]) === targetDate) {
      return i;
    }
  }
  return null;
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

  // 선택된 날짜의 아이템들
  const selectedItems = useMemo(() => {
    if (!selectedDateStr) return null;

    const matchingGoals = weeklyGoals.filter(
      (g) => g.deadline === selectedDateStr && !g.is_completed
    );

    const matchingMilestones = milestones.filter((m) => {
      if (!m.startDate || !m.endDate) return false;
      return selectedDateStr >= m.startDate && selectedDateStr <= m.endDate;
    });

    const matchingEvents = calendarEvents.filter((e) => {
      const eventDate = e.startDatetime.split("T")[0];
      return eventDate === selectedDateStr;
    });

    return {
      goals: matchingGoals,
      milestones: matchingMilestones,
      events: matchingEvents,
    };
  }, [selectedDateStr, weeklyGoals, milestones, calendarEvents]);

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

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
              onClick={() => setWeekOffset((prev) => prev - 1)}
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
              onClick={() => setWeekOffset((prev) => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Header - 날짜 */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-14 gap-0.5 mb-1">
              {dates.map((date, i) => (
                <div
                  key={i}
                  className={`text-center text-xs font-medium py-1 ${
                    date.getDay() === 0
                      ? "text-red-500"
                      : date.getDay() === 6
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {weekdays[date.getDay()]}
                </div>
              ))}
            </div>

            {/* 날짜 셀 */}
            <div className="grid grid-cols-14 gap-0.5 mb-2">
              {dates.map((date) => {
                const dateStr = formatDateString(date);
                const isTodayDate = isToday(date);
                const isSelected =
                  selectedDate && formatDateString(selectedDate) === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      p-1.5 text-center rounded transition-colors text-sm
                      hover:bg-muted
                      ${isSelected ? "bg-primary/10 ring-2 ring-primary" : ""}
                      ${isTodayDate && !isSelected ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    <span
                      className={isTodayDate ? "font-bold text-blue-600" : ""}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 간트 차트 영역 */}
            <div className="space-y-1 relative border-t pt-2">
              {/* 마일스톤 바 */}
              {milestones.map((milestone) => {
                if (!milestone.startDate || !milestone.endDate) return null;
                const pos = calculateBarPosition(
                  milestone.startDate,
                  milestone.endDate,
                  dates
                );
                if (!pos) return null;

                return (
                  <Link
                    key={milestone.id}
                    href={`/research/${milestone.projectId}`}
                    className="block"
                  >
                    <div
                      className="grid grid-cols-14 gap-0.5"
                      style={{ minHeight: "24px" }}
                    >
                      {Array.from({ length: 14 }).map((_, i) => {
                        const isInRange =
                          i >= pos.startCol && i < pos.startCol + pos.span;
                        const isStart = i === pos.startCol;
                        const isEnd = i === pos.startCol + pos.span - 1;

                        if (!isInRange) {
                          return <div key={i} />;
                        }

                        return (
                          <div
                            key={i}
                            className={`
                              h-6 flex items-center justify-center text-xs text-white
                              hover:opacity-80 transition-opacity cursor-pointer
                              ${isStart ? "rounded-l" : ""}
                              ${isEnd ? "rounded-r" : ""}
                            `}
                            style={{
                              backgroundColor: TIMELINE_ITEM_CONFIG.milestone.color,
                            }}
                            title={`${MILESTONE_STAGE_LABEL[milestone.stage] || milestone.stage} - ${milestone.projectTitle} (${milestone.progress}%)`}
                          >
                            {isStart && (
                              <span className="truncate px-1 flex items-center gap-1">
                                <Flag className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {MILESTONE_STAGE_LABEL[milestone.stage] || milestone.stage}
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

              {/* 주간 목표 (점으로 표시) */}
              {weeklyGoals.filter((g) => !g.is_completed).length > 0 && (
                <div className="grid grid-cols-14 gap-0.5" style={{ minHeight: "24px" }}>
                  {dates.map((date, i) => {
                    const dateStr = formatDateString(date);
                    const goalsOnDate = weeklyGoals.filter(
                      (g) => g.deadline === dateStr && !g.is_completed
                    );

                    if (goalsOnDate.length === 0) {
                      return <div key={i} />;
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center justify-center"
                      >
                        {goalsOnDate.map((goal) => (
                          <Link
                            key={goal.id}
                            href={`/research/${goal.projectId}`}
                            className="group relative"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                              style={{
                                backgroundColor: TIMELINE_ITEM_CONFIG.weekly_goal.color,
                              }}
                              title={`${goal.content} - ${goal.projectTitle}`}
                            >
                              <Target className="h-3 w-3 text-white" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 일정 (점으로 표시) */}
              {calendarEvents.length > 0 && (
                <div className="grid grid-cols-14 gap-0.5" style={{ minHeight: "24px" }}>
                  {dates.map((date, i) => {
                    const dateStr = formatDateString(date);
                    const eventsOnDate = calendarEvents.filter((e) => {
                      const eventDate = e.startDatetime.split("T")[0];
                      return eventDate === dateStr;
                    });

                    if (eventsOnDate.length === 0) {
                      return <div key={i} />;
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center justify-center gap-0.5"
                      >
                        {eventsOnDate.slice(0, 2).map((event) => {
                          const config = CALENDAR_CATEGORY_CONFIG[event.category];
                          return (
                            <Link key={event.id} href="/calendar">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                style={{
                                  backgroundColor: config?.color || "#10b981",
                                }}
                                title={`${event.title} (${config?.label || event.category})`}
                              >
                                <Calendar className="h-2.5 w-2.5 text-white" />
                              </div>
                            </Link>
                          );
                        })}
                        {eventsOnDate.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{eventsOnDate.length - 2}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 빈 상태 */}
              {milestones.length === 0 &&
                weeklyGoals.filter((g) => !g.is_completed).length === 0 &&
                calendarEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    이 기간에 등록된 항목이 없습니다.
                  </p>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: TIMELINE_ITEM_CONFIG.milestone.color,
                  }}
                />
                <span>마일스톤</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: TIMELINE_ITEM_CONFIG.weekly_goal.color,
                  }}
                />
                <span>주간 목표</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>일정</span>
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 날짜 상세 패널 */}
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
