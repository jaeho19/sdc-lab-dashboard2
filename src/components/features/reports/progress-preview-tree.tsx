"use client";

import { useState, useMemo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SubProject, ProgressLogWithDetails } from "@/types/database";

interface ProgressPreviewTreeProps {
  subProjects: SubProject[];
  progressLogs: ProgressLogWithDetails[];
  checkedLogIds: Set<string>;
  onToggleLog: (logId: string) => void;
  onToggleSubProject: (subProjectId: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function ProgressPreviewTree({
  subProjects,
  progressLogs,
  checkedLogIds,
  onToggleLog,
  onToggleSubProject,
}: ProgressPreviewTreeProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    return new Set(subProjects.map((sp) => sp.id));
  });

  const logsBySubProject = useMemo(() => {
    const map = new Map<string, ProgressLogWithDetails[]>();
    for (const log of progressLogs) {
      const key = log.sub_project_id ?? "__unassigned__";
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, log]);
    }
    return map;
  }, [progressLogs]);

  const sortedSubProjects = useMemo(() => {
    return [...subProjects].sort((a, b) => a.sort_order - b.sort_order);
  }, [subProjects]);

  const getSubProjectCheckState = useCallback(
    (subProjectId: string): "checked" | "unchecked" | "indeterminate" => {
      const logs = logsBySubProject.get(subProjectId) ?? [];
      if (logs.length === 0) return "unchecked";
      const checkedCount = logs.filter((l) => checkedLogIds.has(l.id)).length;
      if (checkedCount === 0) return "unchecked";
      if (checkedCount === logs.length) return "checked";
      return "indeterminate";
    },
    [logsBySubProject, checkedLogIds]
  );

  const handleToggleOpen = useCallback((subProjectId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(subProjectId)) {
        next.delete(subProjectId);
      } else {
        next.add(subProjectId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-1">
      {sortedSubProjects.map((sp) => {
        const logs = logsBySubProject.get(sp.id) ?? [];
        const checkState = getSubProjectCheckState(sp.id);
        const isOpen = openSections.has(sp.id);

        return (
          <Collapsible
            key={sp.id}
            open={isOpen}
            onOpenChange={() => handleToggleOpen(sp.id)}
          >
            <div className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>

              <Checkbox
                checked={checkState === "checked" ? true : checkState === "indeterminate" ? "indeterminate" : false}
                onCheckedChange={() => onToggleSubProject(sp.id)}
                disabled={logs.length === 0}
                className="shrink-0"
              />

              <span className="text-sm font-medium truncate">
                {sp.sort_order}. {sp.name}
              </span>

              {logs.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  ({logs.filter((l) => checkedLogIds.has(l.id)).length}/{logs.length})
                </span>
              )}
            </div>

            <CollapsibleContent>
              <div className="ml-7 border-l border-border pl-3 space-y-0.5">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1 italic">
                    (해당 기간 추진경과 없음)
                  </p>
                ) : (
                  logs.map((log) => (
                    <label
                      key={log.id}
                      className="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checkedLogIds.has(log.id)}
                        onCheckedChange={() => onToggleLog(log.id)}
                        className="shrink-0"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(log.log_date)}
                      </span>
                      <span className="text-sm truncate">{log.title}</span>
                      {log.assignee_name && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                          ({log.assignee_name})
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
