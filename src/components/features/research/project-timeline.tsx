"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateMilestoneDates } from "@/lib/actions/research";
import { MILESTONE_STAGES } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit2,
  Loader2,
} from "lucide-react";
import type { MilestoneStage } from "@/types/database.types";

interface MilestoneWithDates {
  id: string;
  title: string;
  stage: string;
  weight: number;
  order_index: number;
  progress: number;
  start_date: string | null;
  end_date: string | null;
}

interface WeeklyGoalForTimeline {
  id: string;
  content: string;
  deadline: string;
  linked_stage: MilestoneStage | null;
  is_completed: boolean;
}

interface ProjectTimelineProps {
  projectId: string;
  milestones: MilestoneWithDates[];
  projectDeadline: string | null;
  onRefresh: () => void;
  goals?: WeeklyGoalForTimeline[];
}

type MilestoneStatus = "completed" | "in_progress" | "not_started" | "delayed";

function getMilestoneStatus(
  milestone: MilestoneWithDates,
  today: Date
): MilestoneStatus {
  if (milestone.progress === 100) return "completed";

  if (!milestone.start_date || !milestone.end_date) {
    return milestone.progress > 0 ? "in_progress" : "not_started";
  }

  const endDate = new Date(milestone.end_date);
  if (today > endDate && milestone.progress < 100) return "delayed";
  if (milestone.progress > 0) return "in_progress";
  return "not_started";
}

function getStatusColor(status: MilestoneStatus): string {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "in_progress":
      return "bg-blue-500";
    case "delayed":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

function getStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case "completed":
      return "완료";
    case "in_progress":
      return "진행중";
    case "delayed":
      return "지연";
    default:
      return "미시작";
  }
}

function getGoalStatus(
  goal: WeeklyGoalForTimeline,
  today: Date
): MilestoneStatus {
  if (goal.is_completed) return "completed";

  const deadlineDate = new Date(goal.deadline);
  deadlineDate.setHours(23, 59, 59, 999);

  if (today > deadlineDate) return "delayed";
  return "in_progress";
}

function getWeekRange(deadline: string): { start: Date; end: Date } {
  const date = new Date(deadline);
  const dayOfWeek = date.getDay();

  // Get Sunday (start of week)
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  // Get Saturday (end of week)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getStageLabel(stage: MilestoneStage): string {
  const stageIndex = MILESTONE_STAGES.findIndex((s) => s.key === stage);
  return stageIndex >= 0 ? `${stageIndex + 1}단계` : "";
}

export function ProjectTimeline({
  projectId,
  milestones,
  projectDeadline,
  onRefresh,
  goals,
}: ProjectTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingMilestone, setEditingMilestone] =
    useState<MilestoneWithDates | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date(), []);

  // 목표를 마감일 기준으로 정렬
  const sortedGoals = useMemo(() => {
    if (!goals) return [];
    return [...goals].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }, [goals]);

  // 목표가 있으면 목표 사용, 없으면 마일스톤 사용
  const useGoals = goals && goals.length > 0;

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => a.order_index - b.order_index);
  }, [milestones]);

  const { timelineStart, timelineEnd, months, weeks } = useMemo(() => {
    const dates: Date[] = [];

    if (useGoals) {
      // 목표 기반 날짜 계산
      sortedGoals.forEach((goal) => {
        const weekRange = getWeekRange(goal.deadline);
        dates.push(weekRange.start);
        dates.push(weekRange.end);
      });
    } else {
      // 마일스톤 기반 날짜 계산
      sortedMilestones.forEach((m) => {
        if (m.start_date) dates.push(new Date(m.start_date));
        if (m.end_date) dates.push(new Date(m.end_date));
      });
    }

    if (projectDeadline) dates.push(new Date(projectDeadline));
    dates.push(today);

    if (dates.length === 0) {
      const defaultStart = new Date();
      const defaultEnd = new Date();
      defaultEnd.setMonth(defaultEnd.getMonth() + 6);
      dates.push(defaultStart, defaultEnd);
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);

    const monthsList: { year: number; month: number; label: string; weeksCount: number }[] = [];
    const weeksList: { month: number; week: number; label: string }[] = [];

    const current = new Date(minDate);
    while (current <= maxDate) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);

      monthsList.push({
        year,
        month,
        label: `${month + 1}월`,
        weeksCount: weeksInMonth,
      });

      for (let w = 1; w <= weeksInMonth; w++) {
        weeksList.push({
          month,
          week: w,
          label: `${w}주`,
        });
      }

      current.setMonth(current.getMonth() + 1);
    }

    return {
      timelineStart: minDate,
      timelineEnd: maxDate,
      months: monthsList,
      weeks: weeksList,
    };
  }, [sortedMilestones, sortedGoals, useGoals, projectDeadline, today]);

  const totalWeeks = weeks.length;

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate total days for precise positioning
    const totalDays = Math.ceil(
      (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const startOffset = Math.max(
      0,
      Math.ceil(
        (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 2)}%` };
  };

  const todayPosition = useMemo(() => {
    const totalDays = Math.ceil(
      (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const offset = Math.ceil(
      (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${(offset / totalDays) * 100}%`;
  }, [today, timelineStart, timelineEnd]);

  const handleEditMilestone = (milestone: MilestoneWithDates) => {
    setEditingMilestone(milestone);
    setEditStartDate(milestone.start_date || "");
    setEditEndDate(milestone.end_date || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveDates = async () => {
    if (!editingMilestone) return;
    setSaving(true);

    await updateMilestoneDates(
      editingMilestone.id,
      editStartDate || null,
      editEndDate || null,
      projectId
    );

    setEditingMilestone(null);
    setIsEditDialogOpen(false);
    setSaving(false);
    onRefresh();
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setEditingMilestone(null);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            프로젝트 타임라인
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* 범례 */}
          <div className="flex gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>완료</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>진행중</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-300" />
              <span>미시작</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>지연</span>
            </div>
          </div>

          {/* 타임라인 */}
          <div className="relative">
            {/* 월 헤더 */}
            <div className="flex border-b">
              <div className="w-32 shrink-0" />
              <div className="flex-1 flex">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="text-center text-xs font-medium text-foreground py-1 border-l first:border-l-0"
                    style={{ flex: month.weeksCount }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>
            {/* 주차 헤더 */}
            <div className="flex border-b mb-2">
              <div className="w-32 shrink-0" />
              <div className="flex-1 flex">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center text-[10px] text-muted-foreground py-0.5 border-l first:border-l-0"
                  >
                    {week.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 간트 차트 바 */}
            <TooltipProvider>
              {useGoals ? (
                // 목표 기반 타임라인
                sortedGoals.map((goal, index) => {
                  const status = getGoalStatus(goal, today);
                  const weekRange = getWeekRange(goal.deadline);
                  const startDateStr = weekRange.start.toISOString().split("T")[0];
                  const endDateStr = weekRange.end.toISOString().split("T")[0];

                  return (
                    <div key={goal.id} className="flex items-center h-10">
                      {/* 목표 제목 */}
                      <div className="w-40 shrink-0 flex items-center gap-2 pr-2">
                        <span className="text-xs font-medium truncate" title={goal.content}>
                          {index + 1}. {goal.content}
                        </span>
                      </div>

                      {/* 바 영역 */}
                      <div className="flex-1 relative h-6 bg-muted/30 rounded">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute h-full rounded cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(
                                status
                              )}`}
                              style={getBarPosition(startDateStr, endDateStr)}
                            >
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                {goal.is_completed ? "완료" : formatDate(goal.deadline)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <p className="font-medium">{goal.content}</p>
                              <p>마감일: {formatDate(goal.deadline)}</p>
                              <p>상태: {getStatusLabel(status)}</p>
                              {goal.linked_stage && (
                                <p>연결 단계: {getStageLabel(goal.linked_stage)}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* 연결 단계 배지 */}
                      <div className="w-16 shrink-0 flex justify-end pl-2">
                        {goal.linked_stage && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {getStageLabel(goal.linked_stage)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // 마일스톤 기반 타임라인 (기존 로직)
                sortedMilestones.map((milestone, index) => {
                  const status = getMilestoneStatus(milestone, today);
                  const hasDateRange = milestone.start_date && milestone.end_date;

                  return (
                    <div key={milestone.id} className="flex items-center h-10">
                      {/* 단계명 */}
                      <div className="w-32 shrink-0 flex items-center gap-2 pr-2">
                        <span className="text-xs font-medium truncate">
                          {index + 1}. {milestone.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => handleEditMilestone(milestone)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 바 영역 */}
                      <div className="flex-1 relative h-6 bg-muted/30 rounded">
                        {hasDateRange && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute h-full rounded cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(
                                  status
                                )}`}
                                style={getBarPosition(
                                  milestone.start_date!,
                                  milestone.end_date!
                                )}
                              >
                                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                  {milestone.progress}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p className="font-medium">{milestone.title}</p>
                                <p>
                                  {formatDate(milestone.start_date!)} ~{" "}
                                  {formatDate(milestone.end_date!)}
                                </p>
                                <p>
                                  진행률: {milestone.progress}% ({getStatusLabel(status)})
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {!hasDateRange && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                            일정 미설정
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TooltipProvider>

            {/* 오늘 표시 선 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-orange-500 z-10"
              style={{ left: `calc(8rem + ${todayPosition})` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-orange-500 whitespace-nowrap">
                오늘
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {/* 일정 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMilestone?.title} 일정 설정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveDates} disabled={saving}>
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                저장
              </Button>
              <Button variant="outline" onClick={handleCloseDialog}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
