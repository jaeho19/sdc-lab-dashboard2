"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { addNoteComment, deleteNoteComment } from "@/lib/actions/research-notes";
import { formatDate, getInitials } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface NoteCommentSectionProps {
  noteId: string;
  projectId: string;
  comments: Comment[];
  currentUserId: string | null;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function NoteCommentSection({
  noteId,
  projectId,
  comments,
  currentUserId,
  isAdmin,
  onRefresh,
}: NoteCommentSectionProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const result = await addNoteComment(noteId, content.trim());
      if (!result.error) {
        setContent("");
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말로 이 코멘트를 삭제하시겠습니까?")) return;

    setDeletingId(commentId);
    try {
      await deleteNoteComment(commentId, projectId);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>코멘트 ({comments.length})</span>
      </div>

      {/* 코멘트 목록 */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete =
              currentUserId === comment.author.id || isAdmin;

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 코멘트 입력 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="코멘트를 입력하세요..."
          rows={2}
          className="flex-1 resize-none"
        />
        <Button
          type="submit"
          disabled={!content.trim() || submitting}
          className="self-end"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          등록
        </Button>
      </form>
    </div>
  );
}
