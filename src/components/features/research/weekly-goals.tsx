"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  addWeeklyGoal,
  toggleWeeklyGoal,
  deleteWeeklyGoal,
  updateWeeklyGoal,
} from "@/lib/actions/research";
import { MILESTONE_STAGES } from "@/lib/utils";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, AlertCircle, Edit2 } from "lucide-react";
import type { MilestoneStage } from "@/types/database.types";

interface WeeklyGoal {
  id: string;
  content: string;
  deadline: string;
  linked_stage: MilestoneStage | null;
  is_completed: boolean;
}

interface WeeklyGoalsProps {
  projectId: string;
  goals: WeeklyGoal[];
  onRefresh: () => void;
}

interface WeekInfo {
  weekNumber: number;
  start: Date;
  end: Date;
  label: string;
}

interface MonthInfo {
  year: number;
  month: number;
  label: string;
  weeks: WeekInfo[];
}

function getMonthInfo(date: Date = new Date()): MonthInfo {
  const year = date.getFullYear();
  const month = date.getMonth();
  const label = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: WeekInfo[] = [];
  let currentWeekStart = new Date(firstDay);
  // Adjust to Sunday (week start)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

  let weekNumber = 1;
  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    weeks.push({
      weekNumber,
      start: new Date(currentWeekStart),
      end: weekEnd,
      label: `${weekNumber}주차 (${formatDate(currentWeekStart)} ~ ${formatDate(weekEnd)})`,
    });

    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
  }

  return { year, month, label, weeks };
}

function getWeekNumberForDate(date: Date, monthInfo: MonthInfo): number {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  for (const week of monthInfo.weeks) {
    const weekStart = new Date(week.start);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(week.end);
    weekEnd.setHours(23, 59, 59, 999);

    if (targetDate >= weekStart && targetDate <= weekEnd) {
      return week.weekNumber;
    }
  }
  return 0; // Outside current month
}

interface GroupedGoals {
  currentMonth: Map<number, WeeklyGoal[]>;
  futureGoals: WeeklyGoal[];
  pastGoals: WeeklyGoal[];
}

function groupGoalsByWeek(goals: WeeklyGoal[], monthInfo: MonthInfo): GroupedGoals {
  const currentMonth = new Map<number, WeeklyGoal[]>();
  const futureGoals: WeeklyGoal[] = [];
  const pastGoals: WeeklyGoal[] = [];

  const monthStart = new Date(monthInfo.year, monthInfo.month, 1);
  const monthEnd = new Date(monthInfo.year, monthInfo.month + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Initialize week buckets
  for (const week of monthInfo.weeks) {
    currentMonth.set(week.weekNumber, []);
  }

  for (const goal of goals) {
    const deadlineDate = new Date(goal.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    if (deadlineDate < monthStart) {
      pastGoals.push(goal);
    } else if (deadlineDate > monthEnd) {
      futureGoals.push(goal);
    } else {
      const weekNum = getWeekNumberForDate(deadlineDate, monthInfo);
      if (weekNum > 0) {
        const weekGoals = currentMonth.get(weekNum) || [];
        weekGoals.push(goal);
        currentMonth.set(weekNum, weekGoals);
      }
    }
  }

  return { currentMonth, futureGoals, pastGoals };
}

interface FutureMonthGroup {
  label: string;
  goals: WeeklyGoal[];
}

function groupFutureGoalsByMonth(goals: WeeklyGoal[]): Map<string, FutureMonthGroup> {
  const grouped = new Map<string, FutureMonthGroup>();

  // Sort goals by deadline first
  const sortedGoals = [...goals].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  for (const goal of sortedGoals) {
    const date = new Date(goal.deadline);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, { label: monthLabel, goals: [] });
    }
    grouped.get(monthKey)!.goals.push(goal);
  }

  return grouped;
}

function getDeadlineStatus(deadline: string): "overdue" | "today" | "normal" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  if (deadlineDate < today) return "overdue";
  if (deadlineDate.getTime() === today.getTime()) return "today";
  return "normal";
}

function getStageLabel(stage: MilestoneStage): string {
  const stageIndex = MILESTONE_STAGES.findIndex((s) => s.key === stage);
  return stageIndex >= 0 ? `${stageIndex + 1}단계` : "";
}

export function WeeklyGoals({ projectId, goals, onRefresh }: WeeklyGoalsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newLinkedStage, setNewLinkedStage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editLinkedStage, setEditLinkedStage] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const [showFuture, setShowFuture] = useState(true);
  const [showPast, setShowPast] = useState(false);

  const monthInfo = useMemo(() => getMonthInfo(), []);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [goals]);

  const pendingGoals = sortedGoals.filter((g) => !g.is_completed);
  const completedGoals = sortedGoals.filter((g) => g.is_completed);

  const groupedGoals = useMemo(() => {
    return groupGoalsByWeek(pendingGoals, monthInfo);
  }, [pendingGoals, monthInfo]);

  const handleAddGoal = async () => {
    if (!newContent.trim() || !newDeadline) return;
    setSaving(true);
    setError(null);

    const linkedStage = newLinkedStage && newLinkedStage !== "none" ? newLinkedStage : undefined;
    const result = await addWeeklyGoal(
      projectId,
      newContent,
      newDeadline,
      linkedStage
    );

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNewContent("");
    setNewDeadline("");
    setNewLinkedStage("");
    setError(null);
    setIsAddDialogOpen(false);
    onRefresh();
  };

  const handleToggleGoal = async (goalId: string, isCompleted: boolean) => {
    await toggleWeeklyGoal(goalId, isCompleted, projectId);
    onRefresh();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("정말로 이 목표를 삭제하시겠습니까?")) return;
    await deleteWeeklyGoal(goalId, projectId);
    onRefresh();
  };

  const handleOpenEditDialog = (goal: WeeklyGoal) => {
    setEditingGoal(goal);
    setEditContent(goal.content);
    setEditDeadline(goal.deadline);
    setEditLinkedStage(goal.linked_stage || "none");
    setEditError(null);
    setIsEditDialogOpen(true);
  };

  const handleEditGoal = async () => {
    if (!editingGoal || !editContent.trim() || !editDeadline) return;
    setSaving(true);
    setEditError(null);

    const linkedStage = editLinkedStage && editLinkedStage !== "none" ? editLinkedStage : null;
    const result = await updateWeeklyGoal(
      editingGoal.id,
      projectId,
      editContent,
      editDeadline,
      linkedStage
    );

    setSaving(false);

    if (result.error) {
      setEditError(result.error);
      return;
    }

    setIsEditDialogOpen(false);
    setEditingGoal(null);
    onRefresh();
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>이번달 목표</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({monthInfo.label})
            </span>
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) setError(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                목표 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>목표 추가</DialogTitle>
              </DialogHeader>
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>할 일 내용</Label>
                  <Input
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="목표 내용을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label>마감일</Label>
                  <Input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>연결 단계 (선택)</Label>
                  <Select
                    value={newLinkedStage}
                    onValueChange={setNewLinkedStage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="단계 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {MILESTONE_STAGES.map((stage, index) => (
                        <SelectItem key={stage.key} value={stage.key}>
                          {index + 1}단계 - {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddGoal}
                    disabled={!newContent.trim() || !newDeadline || saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    추가
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 목표가 없습니다.
          </p>
        ) : (
          <>
            {/* 지난 달 목표 (마감일 지남) */}
            {groupedGoals.pastGoals.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full py-1"
                >
                  {showPast ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  지난 목표 ({groupedGoals.pastGoals.length})
                </button>
                {showPast && (
                  <div className="space-y-1 pl-2 border-l-2 border-red-200">
                    {groupedGoals.pastGoals.map((goal) => {
                      const status = getDeadlineStatus(goal.deadline);
                      return (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 group"
                        >
                          <Checkbox
                            checked={goal.is_completed}
                            onCheckedChange={(checked) =>
                              handleToggleGoal(goal.id, checked === true)
                            }
                          />
                          <span className="flex-1 text-sm">{goal.content}</span>
                          <span className="text-xs text-red-500 font-medium">
                            {formatDeadline(goal.deadline)}
                          </span>
                          {goal.linked_stage && (
                            <Badge variant="outline" className="text-xs">
                              {getStageLabel(goal.linked_stage)}
                            </Badge>
                          )}
                          <span className="text-red-500 text-xs">!</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleOpenEditDialog(goal)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 이번달 주차별 목표 */}
            {monthInfo.weeks.map((week) => {
              const weekGoals = groupedGoals.currentMonth.get(week.weekNumber) || [];
              if (weekGoals.length === 0) return null;
              return (
                <div key={week.weekNumber} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                    {week.label}
                  </h4>
                  <div className="space-y-1">
                    {weekGoals.map((goal) => {
                      const status = getDeadlineStatus(goal.deadline);
                      return (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 group"
                        >
                          <Checkbox
                            checked={goal.is_completed}
                            onCheckedChange={(checked) =>
                              handleToggleGoal(goal.id, checked === true)
                            }
                          />
                          <span className="flex-1 text-sm">{goal.content}</span>
                          <span
                            className={`text-xs ${
                              status === "overdue"
                                ? "text-red-500 font-medium"
                                : status === "today"
                                ? "text-orange-500 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatDeadline(goal.deadline)}
                          </span>
                          {goal.linked_stage && (
                            <Badge variant="outline" className="text-xs">
                              {getStageLabel(goal.linked_stage)}
                            </Badge>
                          )}
                          {status === "overdue" && (
                            <span className="text-red-500 text-xs">!</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleOpenEditDialog(goal)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 이후 일정 (다음 달 이후) - 월별 그룹화 */}
            {groupedGoals.futureGoals.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowFuture(!showFuture)}
                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 w-full py-1"
                >
                  {showFuture ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  이후 일정 ({groupedGoals.futureGoals.length})
                </button>
                {showFuture && (
                  <div className="space-y-4 pl-2 border-l-2 border-blue-200">
                    {Array.from(groupFutureGoalsByMonth(groupedGoals.futureGoals)).map(
                      ([monthKey, monthGroup]) => (
                        <div key={monthKey} className="space-y-2">
                          <h4 className="text-sm font-medium text-blue-600 border-b border-blue-100 pb-1">
                            {monthGroup.label}
                          </h4>
                          <div className="space-y-1">
                            {monthGroup.goals.map((goal) => (
                              <div
                                key={goal.id}
                                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 group"
                              >
                                <Checkbox
                                  checked={goal.is_completed}
                                  onCheckedChange={(checked) =>
                                    handleToggleGoal(goal.id, checked === true)
                                  }
                                />
                                <span className="flex-1 text-sm">{goal.content}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDeadline(goal.deadline)}
                                </span>
                                {goal.linked_stage && (
                                  <Badge variant="outline" className="text-xs">
                                    {getStageLabel(goal.linked_stage)}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleOpenEditDialog(goal)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 완료된 목표 토글 */}
            {completedGoals.length > 0 && (
              <>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2 border-t mt-2"
                >
                  {showCompleted ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  완료된 목표 ({completedGoals.length})
                </button>

                {showCompleted &&
                  completedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 group opacity-60"
                    >
                      <Checkbox
                        checked={goal.is_completed}
                        onCheckedChange={(checked) =>
                          handleToggleGoal(goal.id, checked === true)
                        }
                      />
                      <span className="flex-1 text-sm line-through text-muted-foreground">
                        {goal.content}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDeadline(goal.deadline)}
                      </span>
                      {goal.linked_stage && (
                        <Badge
                          variant="outline"
                          className="text-xs opacity-50"
                        >
                          {getStageLabel(goal.linked_stage)}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleOpenEditDialog(goal)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingGoal(null);
          setEditError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목표 수정</DialogTitle>
          </DialogHeader>
          {editError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{editError}</span>
            </div>
          )}
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>할 일 내용</Label>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="목표 내용을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>마감일</Label>
              <Input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>연결 단계 (선택)</Label>
              <Select
                value={editLinkedStage}
                onValueChange={setEditLinkedStage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="단계 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안 함</SelectItem>
                  {MILESTONE_STAGES.map((stage, index) => (
                    <SelectItem key={stage.key} value={stage.key}>
                      {index + 1}단계 - {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleEditGoal}
                disabled={!editContent.trim() || !editDeadline || saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                저장
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
