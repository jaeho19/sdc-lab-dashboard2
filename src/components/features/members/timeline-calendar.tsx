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
  startDate.setDate(startDate.getDate() + (offset * 14));

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
  const matchingGoals = goals.filter((g) => g.deadline === dateStr && !g.is_completed);

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
    const formatMonth = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatMonth(start)} ~ ${formatMonth(end)}`;
  }, [dates]);

  const selectedDateStr = selectedDate
    ? formatDateString(selectedDate)
    : null;

  const selectedItems = useMemo(() => {
    if (!selectedDateStr) return null;
    return getItemsForDate(
      selectedDateStr,
      weeklyGoals,
      milestones,
      calendarEvents
    );
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
      <CardContent>
        <div className="flex gap-4">
          {/* Calendar Grid */}
          <div className="flex-1">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdays.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-xs font-medium py-1 ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week 1 */}
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
                  selectedDate &&
                  formatDateString(selectedDate) === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 text-center rounded-md transition-colors min-h-[56px]
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
                              backgroundColor: TIMELINE_ITEM_CONFIG.weekly_goal.color,
                            }}
                          />
                        )}
                        {items.milestones.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: TIMELINE_ITEM_CONFIG.milestone.color,
                            }}
                          />
                        )}
                        {items.events.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Week 2 */}
            <div className="grid grid-cols-7 gap-1">
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
                  selectedDate &&
                  formatDateString(selectedDate) === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 text-center rounded-md transition-colors min-h-[56px]
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
                              backgroundColor: TIMELINE_ITEM_CONFIG.weekly_goal.color,
                            }}
                          />
                        )}
                        {items.milestones.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: TIMELINE_ITEM_CONFIG.milestone.color,
                            }}
                          />
                        )}
                        {items.events.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TIMELINE_ITEM_CONFIG.weekly_goal.color }}
                />
                <span>주간 목표</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TIMELINE_ITEM_CONFIG.milestone.color }}
                />
                <span>마일스톤</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>일정</span>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="w-64 border-l pl-4 min-h-[200px]">
            {selectedDate ? (
              <div>
                <h4 className="font-medium mb-3">
                  {formatDateLabel(selectedDate)}
                </h4>
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {/* Weekly Goals */}
                  {selectedItems?.goals.map((goal) => (
                    <Link
                      key={goal.id}
                      href={`/research/${goal.projectId}`}
                      className="block p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Target
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={{ color: TIMELINE_ITEM_CONFIG.weekly_goal.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{goal.content}</p>
                          <p className="text-xs text-muted-foreground truncate">
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
                      className="block p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Flag
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={{ color: TIMELINE_ITEM_CONFIG.milestone.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {MILESTONE_STAGE_LABEL[milestone.stage] || milestone.stage}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {milestone.projectTitle}
                            </p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {milestone.progress}%
                            </Badge>
                          </div>
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
                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Calendar
                            className="h-4 w-4 mt-0.5 shrink-0"
                            style={{ color: config?.color || "#10b981" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{event.title}</p>
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  날짜를 선택하세요
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
