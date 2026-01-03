"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  Loader2,
  Paperclip,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deleteResearchNote, uploadNoteFile, deleteNoteFile } from "@/lib/actions/research-notes";
import { formatDate, getInitials } from "@/lib/utils";
import { MILESTONE_STAGE_LABEL } from "@/lib/constants";
import { NoteCommentSection } from "./note-comment-section";
import { createClient } from "@/lib/supabase/client";
import type { MilestoneStage } from "@/types/database.types";

interface Author {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: Author;
}

interface FileItem {
  id: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

interface ResearchNoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    keywords: string[];
    created_at: string;
    milestone_id: string;
    milestone: {
      stage: MilestoneStage;
    };
    author: Author;
    comments: Comment[];
    files: FileItem[];
  };
  projectId: string;
  currentUserId: string | null;
  isAdmin: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onRefresh: () => void;
}

export function ResearchNoteCard({
  note,
  projectId,
  currentUserId,
  isAdmin,
  canEdit,
  onEdit,
  onRefresh,
}: ResearchNoteCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isAuthor = currentUserId === note.author.id;

  const handleDelete = async () => {
    if (!confirm("정말로 이 연구노트를 삭제하시겠습니까?")) return;

    setDeleting(true);
    try {
      await deleteResearchNote(note.id);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadNoteFile(note.id, formData);
      if (!result.error) {
        onRefresh();
      } else {
        alert(result.error);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("research-notes")
        .download(file.file_path);

      if (error) {
        alert("파일 다운로드에 실패했습니다.");
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("정말로 이 파일을 삭제하시겠습니까?")) return;

    await deleteNoteFile(fileId, projectId);
    onRefresh();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <CollapsibleTrigger className="flex-1 text-left">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{note.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {MILESTONE_STAGE_LABEL[note.milestone.stage] ||
                        note.milestone.stage}
                    </Badge>
                    <span>|</span>
                    <span>{note.author.name}</span>
                    <span>|</span>
                    <span>{formatDate(note.created_at)}</span>
                    {note.comments.length > 0 && (
                      <>
                        <span>|</span>
                        <span>코멘트 {note.comments.length}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              {(isAuthor || isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 키워드 (항상 표시) */}
          {note.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-8">
              {note.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  #{keyword}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-4">
            {/* 본문 (마크다운 렌더링) */}
            <div className="prose prose-sm max-w-none dark:prose-invert pl-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            </div>

            {/* 첨부파일 */}
            <div className="pl-8 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  <span>첨부파일 ({note.files.length})</span>
                </div>
                {canEdit && (
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={uploading}
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        파일 추가
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {note.files.length > 0 && (
                <div className="space-y-1">
                  {note.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <span className="text-sm truncate flex-1">
                        {file.original_filename}
                        <span className="text-muted-foreground ml-2">
                          ({formatFileSize(file.file_size)})
                        </span>
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => handleFileDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 코멘트 섹션 */}
            <div className="pl-8 border-t pt-4">
              <NoteCommentSection
                noteId={note.id}
                projectId={projectId}
                comments={note.comments}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onRefresh={onRefresh}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
