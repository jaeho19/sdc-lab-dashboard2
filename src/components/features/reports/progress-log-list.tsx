"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProgressLogs,
  getSubProjects,
  deleteProgressLog,
} from "@/lib/actions/reports";
import type {
  ProgressLogType,
  ProgressLogStatus,
  SubProject,
} from "@/types/database";
import { ProgressLogForm } from "./progress-log-form";

const logTypeLabels: Record<ProgressLogType, string> = {
  task: "업무",
  meeting: "회의",
  report: "보고",
  consulting: "컨설팅",
  fieldwork: "현장활동",
  other: "기타",
};

const statusLabels: Record<ProgressLogStatus, string> = {
  completed: "완료",
  in_progress: "진행중",
  planned: "계획",
};

const statusVariants: Record<
  ProgressLogStatus,
  "default" | "secondary" | "outline"
> = {
  completed: "default",
  in_progress: "secondary",
  planned: "outline",
};

interface ProgressLogListProps {
  projects: Array<Record<string, unknown>>;
  currentMember: Record<string, unknown>;
}

export function ProgressLogList({
  projects,
  currentMember,
}: ProgressLogListProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? (projects[0].id as string) : ""
  );
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<Record<
    string,
    unknown
  > | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!selectedProjectId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const result = await getProgressLogs({
        projectId: selectedProjectId,
        startDate,
        endDate,
      });
      if (result.data) {
        setLogs(result.data as Array<Record<string, unknown>>);
      }
    } catch (err) {
      console.error("Failed to fetch progress logs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, startDate, endDate]);

  const fetchSubProjects = useCallback(async () => {
    if (!selectedProjectId) return;
    const result = await getSubProjects(selectedProjectId);
    if (result.data) {
      setSubProjects(result.data as SubProject[]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchSubProjects();
  }, [fetchSubProjects]);

  const handleDelete = useCallback(
    async (logId: string) => {
      if (!confirm("추진경과를 삭제하시겠습니까?")) return;
      const result = await deleteProgressLog(logId);
      if (!result.error) {
        await fetchLogs();
      }
    },
    [fetchLogs]
  );

  const handleEdit = useCallback((log: Record<string, unknown>) => {
    setEditingLog(log);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingLog(null);
  }, []);

  const handleFormSaved = useCallback(async () => {
    handleFormClose();
    await fetchLogs();
  }, [handleFormClose, fetchLogs]);

  const subProjectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const sp of subProjects) {
      map.set(sp.id, sp.name);
    }
    return map;
  }, [subProjects]);

  return (
    <>
      {/* Back link */}
      <Link href="/reports">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          보고서 목록
        </Button>
      </Link>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>프로젝트</Label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="프로젝트 선택" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id as string} value={p.id as string}>
                  {(p.short_name as string) || (p.name as string)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>시작일</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-1">
          <Label>종료일</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Button
          onClick={() => {
            setFormOpen(true);
            setEditingLog(null);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          추진경과 등록
        </Button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">불러오는 중...</span>
        </div>
      ) : logs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>단위사업</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-[100px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const logType = log.log_type as ProgressLogType;
                  const logStatus = log.status as ProgressLogStatus;
                  const subProjectName = log.sub_project_id
                    ? subProjectMap.get(log.sub_project_id as string) ?? "-"
                    : "-";

                  return (
                    <TableRow key={log.id as string}>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.log_date as string}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.title as string}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {subProjectName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {logTypeLabels[logType] ?? logType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[logStatus] ?? "secondary"}>
                          {statusLabels[logStatus] ?? logStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(log.id as string)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium">추진경과가 없습니다</p>
            <p className="text-muted-foreground mt-1">
              새 추진경과를 등록하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress Log Form Dialog */}
      <ProgressLogForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
          else setFormOpen(true);
        }}
        onSaved={handleFormSaved}
        projectId={selectedProjectId}
        subProjects={subProjects}
        editingLog={editingLog}
        currentMemberId={currentMember.id as string}
      />
    </>
  );
}
