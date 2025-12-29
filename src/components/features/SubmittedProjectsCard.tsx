"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { updateSubmissionStatus } from "@/lib/actions/research";
import { getSubmissionStatusLabel, getSubmissionStatusColor } from "@/lib/utils";
import type { SubmissionStatus } from "@/types/database.types";
import Link from "next/link";

const QUICK_STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "under_revision", label: "Under Revision" },
  { value: "resubmitted", label: "Resubmitted" },
  { value: "under_2nd_review", label: "Under 2nd Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

type Project = {
  id: string;
  title: string;
  submission_status: SubmissionStatus;
  target_journal: string | null;
};

export function SubmittedProjectsCard({ projects }: { projects: Project[] }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);

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

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Send className="h-4 w-4 md:h-5 md:w-5" />
          투고 중인 연구
          <Badge variant="secondary" className="ml-auto text-xs">
            {localProjects.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className="space-y-3 md:space-y-4">
          {localProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-2"
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
              <Select
                value={project.submission_status}
                onValueChange={(value) => handleStatusChange(project.id, value)}
                disabled={updatingId === project.id}
              >
                <SelectTrigger
                  className={`w-[140px] md:w-[160px] h-8 text-xs ${getSubmissionStatusColor(project.submission_status)}`}
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
            </div>
          ))}
          {localProjects.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              투고 중인 연구가 없습니다.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
