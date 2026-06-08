"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Send,
  Archive,
  ChevronDown,
  ArchiveRestore,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  updateSubmissionStatus,
  toggleProjectArchive,
  updateFirstAuthor,
  createProject,
} from "@/lib/actions/research";
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
  first_author: string | null;
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
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);
  const [localArchivedProjects, setLocalArchivedProjects] = useState(archivedProjects);
  const [isArchivedOpen, setIsArchivedOpen] = useState(true);

  // 주저자 인라인 편집 상태
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [authorDraft, setAuthorDraft] = useState("");
  const [savingAuthorId, setSavingAuthorId] = useState<string | null>(null);

  // 새 투고 추가 다이얼로그 상태
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newJournal, setNewJournal] = useState("");
  const [newFirstAuthor, setNewFirstAuthor] = useState("");
  const [newStatus, setNewStatus] = useState<string>("submitted");

  async function handleStatusChange(projectId: string, newStatusValue: string) {
    setUpdatingId(projectId);

    // Optimistic update
    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, submission_status: newStatusValue as SubmissionStatus }
          : p
      )
    );

    const result = await updateSubmissionStatus(projectId, newStatusValue);

    if (result.error) {
      // Revert on error
      setLocalProjects(projects);
      alert(result.error);
    }

    setUpdatingId(null);
  }

  function startEditAuthor(project: Project) {
    setEditingAuthorId(project.id);
    setAuthorDraft(project.first_author ?? "");
  }

  function cancelEditAuthor() {
    setEditingAuthorId(null);
    setAuthorDraft("");
  }

  async function handleAuthorSave(projectId: string) {
    const value = authorDraft.trim();
    setSavingAuthorId(projectId);

    // Optimistic update (활성/아카이브 양쪽 모두 반영)
    const apply = (p: Project) =>
      p.id === projectId ? { ...p, first_author: value || null } : p;
    setLocalProjects((prev) => prev.map(apply));
    setLocalArchivedProjects((prev) => prev.map(apply));

    const result = await updateFirstAuthor(projectId, value);

    if (result.error) {
      // Revert on error
      setLocalProjects(projects);
      setLocalArchivedProjects(archivedProjects);
      alert(result.error);
    }

    setSavingAuthorId(null);
    setEditingAuthorId(null);
    setAuthorDraft("");
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

  function resetAddForm() {
    setNewTitle("");
    setNewJournal("");
    setNewFirstAuthor("");
    setNewStatus("submitted");
    setAddError(null);
  }

  async function handleAddSubmit() {
    if (!newTitle.trim()) {
      setAddError("제목을 입력해주세요.");
      return;
    }
    setAdding(true);
    setAddError(null);

    const result = await createProject({
      title: newTitle.trim(),
      category: "submission",
      status: "preparing",
      target_journal: newJournal.trim() || undefined,
      first_author: newFirstAuthor.trim() || undefined,
      submission_status: newStatus,
    });

    if (result.error || !result.id) {
      setAddError(result.error || "투고 추가 중 오류가 발생했습니다.");
      setAdding(false);
      return;
    }

    // Optimistic: 새 항목을 카드 상단에 즉시 추가
    setLocalProjects((prev) => [
      {
        id: result.id as string,
        title: newTitle.trim(),
        submission_status: newStatus as SubmissionStatus,
        target_journal: newJournal.trim() || null,
        first_author: newFirstAuthor.trim() || null,
      },
      ...prev,
    ]);

    setAdding(false);
    setIsAddOpen(false);
    resetAddForm();
    router.refresh();
  }

  const renderAuthorRow = (project: Project, isArchived: boolean) => {
    const isEditing = editingAuthorId === project.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={authorDraft}
            onChange={(e) => setAuthorDraft(e.target.value)}
            placeholder="주저자 이름"
            autoFocus
            className="h-6 w-32 text-xs"
            disabled={savingAuthorId === project.id}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAuthorSave(project.id);
              if (e.key === "Escape") cancelEditAuthor();
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            onClick={() => handleAuthorSave(project.id)}
            disabled={savingAuthorId === project.id}
            title="저장"
          >
            {savingAuthorId === project.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={cancelEditAuthor}
            disabled={savingAuthorId === project.id}
            title="취소"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    // 아카이브 항목은 표시만, 활성 항목은 클릭하여 편집
    if (isArchived) {
      return (
        <span className="text-xs text-muted-foreground block">
          주저자: {project.first_author || "미지정"}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => startEditAuthor(project)}
        className="group/author flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        title="주저자 수정"
      >
        <span>주저자: {project.first_author || "미지정"}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover/author:opacity-100 transition-opacity" />
      </button>
    );
  };

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
        {renderAuthorRow(project, isArchived)}
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
          <Badge variant="secondary" className="ml-2 text-xs">
            {localProjects.length}건
          </Badge>
          <Dialog
            open={isAddOpen}
            onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) resetAddForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="ml-auto h-8">
                <Plus className="h-4 w-4 mr-1" />
                새 투고
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 투고 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {addError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {addError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-title">제목 *</Label>
                  <Input
                    id="new-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="연구 제목"
                    disabled={adding}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-journal">타겟 저널</Label>
                  <Input
                    id="new-journal"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    placeholder="예: Journal of Urban Planning"
                    disabled={adding}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-author">주저자</Label>
                  <Input
                    id="new-author"
                    value={newFirstAuthor}
                    onChange={(e) => setNewFirstAuthor(e.target.value)}
                    placeholder="주저자 이름"
                    disabled={adding}
                  />
                </div>
                <div className="space-y-2">
                  <Label>투고 상태</Label>
                  <Select value={newStatus} onValueChange={setNewStatus} disabled={adding}>
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddSubmit} disabled={adding || !newTitle.trim()}>
                    {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    추가
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddOpen(false);
                      resetAddForm();
                    }}
                    disabled={adding}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
