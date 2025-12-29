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
} from "@/lib/actions/research";
import { MILESTONE_STAGES } from "@/lib/utils";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
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

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToSunday = dayOfWeek === 0 ? 0 : -dayOfWeek;
  const diffToSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToSunday);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + diffToSaturday);

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  };

  return {
    start: startOfWeek.toISOString().split("T")[0],
    end: endOfWeek.toISOString().split("T")[0],
    label: `${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`,
  };
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

  const weekRange = useMemo(() => getWeekRange(), []);

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
            <span>이번 주 목표</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({weekRange.label})
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
                <DialogTitle>주간 목표 추가</DialogTitle>
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
      <CardContent className="space-y-2">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 주간 목표가 없습니다.
          </p>
        ) : (
          <>
            {/* 미완료 목표 */}
            {pendingGoals.map((goal) => {
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
                    ~ {formatDeadline(goal.deadline)}
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
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}

            {/* 완료된 목표 토글 */}
            {completedGoals.length > 0 && (
              <>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2"
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
                        ~ {formatDeadline(goal.deadline)}
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
    </Card>
  );
}
