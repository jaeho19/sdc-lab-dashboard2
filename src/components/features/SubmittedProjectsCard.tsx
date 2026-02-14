"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Send, Archive, ChevronDown, ArchiveRestore } from "lucide-react";
import { updateSubmissionStatus, toggleProjectArchive } from "@/lib/actions/research";
import { getSubmissionStatusLabel, getSubmissionStatusColor, cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/types/database.types";
import Link from "next/link";

const QUICK_STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "under_revision", label: "Under Revision" },
  { value: "resubmitted", label: "Resubmitted" },
  { value: "under_2nd_review", label: "Under 2nd Review" },
  { value: "accepted", label: "Accepted" },
  { value: "in_press", label: "In Press" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

type Project = {
  id: string;
  title: string;
  submission_status: SubmissionStatus;
  target_journal: string | null;
};

// 아카이브 가능한 상태들
const ARCHIVABLE_STATUSES: SubmissionStatus[] = ["accepted", "in_press", "published"];

interface SubmittedProjectsCardProps {
  projects: Project[];
  archivedProjects?: Project[];
  className?: string;
}

export function SubmittedProjectsCard({
  projects,
  archivedProjects = [],
  className,
}: SubmittedProjectsCardProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);
  const [localArchivedProjects, setLocalArchivedProjects] = useState(archivedProjects);
  const [isArchivedOpen, setIsArchivedOpen] = useState(true);

  async function handleStatusChange(projectId: string, newStatus: string) {
    setUpdatingId(projectId);

    // Optimistic update
    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, submission_status: newStatus as SubmissionStatus }
          : p
      )
    );

    const result = await updateSubmissionStatus(projectId, newStatus);

    if (result.error) {
      // Revert on error
      setLocalProjects(projects);
      alert(result.error);
    }

    setUpdatingId(null);
  }

  async function handleArchive(projectId: string) {
    setArchivingId(projectId);

    // Find the project to archive
    const projectToArchive = localProjects.find((p) => p.id === projectId);

    // Optimistic update - 활성 리스트에서 제거하고 아카이브 리스트에 추가
    setLocalProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (projectToArchive) {
      setLocalArchivedProjects((prev) => [projectToArchive, ...prev]);
    }

    const result = await toggleProjectArchive(projectId, true);

    if (result.error) {
      // Revert on error
      setLocalProjects(projects);
      setLocalArchivedProjects(archivedProjects);
      alert(result.error);
    }

    setArchivingId(null);
  }

  async function handleUnarchive(projectId: string) {
    setArchivingId(projectId);

    // Find the project to unarchive
    const projectToUnarchive = localArchivedProjects.find((p) => p.id === projectId);

    // Optimistic update - 아카이브 리스트에서 제거하고 활성 리스트에 추가
    setLocalArchivedProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (projectToUnarchive) {
      setLocalProjects((prev) => [projectToUnarchive, ...prev]);
    }

    const result = await toggleProjectArchive(projectId, false);

    if (result.error) {
      // Revert on error
      setLocalProjects(projects);
      setLocalArchivedProjects(archivedProjects);
      alert(result.error);
    }

    setArchivingId(null);
  }

  const renderProjectItem = (project: Project, isArchived: boolean = false) => (
    <div
      key={project.id}
      className={cn(
        "flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-2",
        isArchived && "bg-muted/30 opacity-80"
      )}
    >
      <div className="space-y-1 flex-1 min-w-0">
        <Link href={`/research/${project.id}`}>
          <p className="font-medium truncate text-sm md:text-base hover:text-primary transition-colors">
            {project.title}
          </p>
        </Link>
        {project.target_journal && (
          <span className="text-xs text-muted-foreground truncate block">
            {project.target_journal}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isArchived ? (
          <>
            <Badge
              variant="secondary"
              className={cn("text-xs", getSubmissionStatusColor(project.submission_status))}
            >
              {getSubmissionStatusLabel(project.submission_status)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-primary"
              onClick={() => handleUnarchive(project.id)}
              disabled={archivingId === project.id}
              title="아카이브에서 복원"
            >
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Select
              value={project.submission_status}
              onValueChange={(value) => handleStatusChange(project.id, value)}
              disabled={updatingId === project.id || archivingId === project.id}
            >
              <SelectTrigger
                className={`w-[120px] md:w-[140px] h-8 text-xs ${getSubmissionStatusColor(project.submission_status)}`}
              >
                <SelectValue>
                  {updatingId === project.id
                    ? "Updating..."
                    : getSubmissionStatusLabel(project.submission_status)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {QUICK_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 아카이브 버튼 - accepted, in_press, published 상태에서만 표시 */}
            {ARCHIVABLE_STATUSES.includes(project.submission_status) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={() => handleArchive(project.id)}
                disabled={archivingId === project.id}
                title="완료된 연구 아카이브"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Send className="h-4 w-4 md:h-5 md:w-5" />
          투고 중인 연구
          <Badge variant="secondary" className="ml-auto text-xs">
            {localProjects.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 flex-1 overflow-auto">
        <div className="space-y-3 md:space-y-4">
          {localProjects.map((project) => renderProjectItem(project, false))}
          {localProjects.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              투고 중인 연구가 없습니다.
            </p>
          )}
        </div>

        {/* 아카이브된 프로젝트 섹션 */}
        {localArchivedProjects.length > 0 && (
          <Collapsible
            open={isArchivedOpen}
            onOpenChange={setIsArchivedOpen}
            className="mt-4 pt-4 border-t"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-9 px-3 text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Archive className="h-4 w-4" />
                  아카이브된 프로젝트
                  <Badge variant="outline" className="text-xs">
                    {localArchivedProjects.length}건
                  </Badge>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isArchivedOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              {localArchivedProjects.map((project) => renderProjectItem(project, true))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
