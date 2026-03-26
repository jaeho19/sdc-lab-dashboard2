"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { addProgressLog, updateProgressLog } from "@/lib/actions/reports";
import type {
  ProgressLogType,
  ProgressLogStatus,
  SubProject,
} from "@/types/database";

const logTypeOptions: { value: ProgressLogType; label: string }[] = [
  { value: "task", label: "업무" },
  { value: "meeting", label: "회의" },
  { value: "report", label: "보고" },
  { value: "consulting", label: "컨설팅" },
  { value: "fieldwork", label: "현장활동" },
  { value: "other", label: "기타" },
];

const statusOptions: { value: ProgressLogStatus; label: string }[] = [
  { value: "completed", label: "완료" },
  { value: "in_progress", label: "진행중" },
  { value: "planned", label: "계획" },
];

interface ProgressLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  projectId: string;
  subProjects: SubProject[];
  editingLog: Record<string, unknown> | null;
  currentMemberId: string;
}

export function ProgressLogForm({
  open,
  onOpenChange,
  onSaved,
  projectId,
  subProjects,
  editingLog,
  currentMemberId,
}: ProgressLogFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subProjectId, setSubProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logDate, setLogDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [logType, setLogType] = useState<ProgressLogType>("task");
  const [status, setStatus] = useState<ProgressLogStatus>("completed");

  // Populate form when editing
  useEffect(() => {
    if (editingLog) {
      setSubProjectId((editingLog.sub_project_id as string) ?? "");
      setTitle((editingLog.title as string) ?? "");
      setDescription((editingLog.description as string) ?? "");
      setLogDate((editingLog.log_date as string) ?? new Date().toISOString().split("T")[0]);
      setLogType((editingLog.log_type as ProgressLogType) ?? "task");
      setStatus((editingLog.status as ProgressLogStatus) ?? "completed");
    } else {
      resetForm();
    }
  }, [editingLog, open]);

  const resetForm = useCallback(() => {
    setSubProjectId("");
    setTitle("");
    setDescription("");
    setLogDate(new Date().toISOString().split("T")[0]);
    setLogType("task");
    setStatus("completed");
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!logDate) {
      setError("날짜를 선택해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingLog) {
        // Update existing
        const result = await updateProgressLog(editingLog.id as string, {
          subProjectId: subProjectId || null,
          title: title.trim(),
          description: description.trim() || null,
          logDate,
          logType,
          status,
        });

        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        // Create new
        const result = await addProgressLog({
          projectId,
          subProjectId: subProjectId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          logDate,
          logType,
          status,
          assigneeId: currentMemberId,
        });

        if (result.error) {
          setError(result.error);
          return;
        }
      }

      onSaved();
    } catch (err) {
      console.error("Progress log save error:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [
    editingLog,
    projectId,
    subProjectId,
    title,
    description,
    logDate,
    logType,
    status,
    currentMemberId,
    onSaved,
  ]);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, resetForm]
  );

  const sortedSubProjects = [...subProjects].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingLog ? "추진경과 수정" : "추진경과 등록"}
          </DialogTitle>
          <DialogDescription>
            {editingLog
              ? "추진경과 정보를 수정합니다."
              : "새 추진경과를 등록합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Sub-project */}
          <div className="space-y-2">
            <Label>단위사업</Label>
            <Select value={subProjectId} onValueChange={setSubProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="단위사업 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">미지정</SelectItem>
                {sortedSubProjects.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.sort_order}. {sp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="log-title">제목 *</Label>
            <Input
              id="log-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="추진경과 제목"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="log-description">설명</Label>
            <Textarea
              id="log-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 설명 (선택사항)"
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="log-date">날짜 *</Label>
            <Input
              id="log-date"
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>유형</Label>
              <Select
                value={logType}
                onValueChange={(v) => setLogType(v as ProgressLogType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProgressLogStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? "저장 중..." : editingLog ? "수정" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
