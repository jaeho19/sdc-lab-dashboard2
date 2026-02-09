"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateDday, formatDate } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
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

function getStatusBadgeProps(status: MilestoneStatus): { label: string; className: string } {
  switch (status) {
    case "completed":
      return { label: "완료", className: "bg-green-500 text-white" };
    case "in_progress":
      return { label: "진행중", className: "bg-blue-500 text-white" };
    case "delayed":
      return { label: "지연", className: "bg-red-500 text-white" };
    default:
      return { label: "미시작", className: "bg-gray-200 text-gray-600" };
  }
}

export function ProjectTimeline({
  milestones,
  projectDeadline,
}: ProjectTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const today = useMemo(() => new Date(), []);

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => a.order_index - b.order_index);
  }, [milestones]);

  const dday = projectDeadline ? calculateDday(projectDeadline) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            프로젝트 일정
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
        <CardContent className="space-y-3">
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">등록된 마일스톤이 없습니다.</p>
            </div>
          ) : (
            <>
              {sortedMilestones.map((milestone, index) => {
                const status = getMilestoneStatus(milestone, today);
                const badge = getStatusBadgeProps(status);

                return (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium w-24 shrink-0 truncate" title={milestone.title}>
                      {milestone.title}
                    </span>
                    <Progress
                      value={milestone.progress}
                      className={`h-2 flex-1 ${
                        status === "completed" ? "[&>div]:bg-green-500" : ""
                      }`}
                    />
                    <span className="text-xs font-medium w-10 text-right shrink-0">
                      {milestone.progress}%
                    </span>
                    <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>
                );
              })}
            </>
          )}

          {/* Deadline D-day */}
          {projectDeadline && dday && (
            <div className="pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                마감일: {formatDate(projectDeadline)}
              </span>
              <Badge
                className={
                  dday.isOverdue
                    ? "bg-red-500"
                    : dday.dday <= 7
                    ? "bg-orange-500"
                    : "bg-blue-500"
                }
              >
                {dday.label}
              </Badge>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
