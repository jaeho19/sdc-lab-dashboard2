"use client";

import { useActionState, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { addComment, deleteComment, type MentoringFormState } from "@/lib/actions/mentoring";

interface CommentAuthor {
  id: string;
  name: string;
  position?: string;
  avatar_url?: string | null;
  profile_image_url?: string | null;
}

interface CommentWithAuthor {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author?: CommentAuthor | null;
}

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId?: string;
  isAdmin: boolean;
}

const initialState: MentoringFormState = {};

export function CommentSection({
  postId,
  comments,
  currentUserId,
  isAdmin,
}: CommentSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addCommentWithId = addComment.bind(null, postId);
  const [state, formAction, isPending] = useActionState(
    async (prevState: MentoringFormState, formData: FormData) => {
      const result = await addCommentWithId(formData);
      if (result.success) {
        // Reset form
        const form = document.getElementById("comment-form") as HTMLFormElement;
        form?.reset();
      }
      return result;
    },
    initialState
  );

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) return;

    setDeletingId(commentId);
    const result = await deleteComment(commentId, postId);

    if (result.error) {
      alert(result.error);
    }
    setDeletingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          댓글 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <form id="comment-form" action={formAction} className="space-y-3">
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          <textarea
            name="content"
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="댓글을 작성하세요..."
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              댓글 작성
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4 pt-4 border-t">
            {comments.map((comment) => {
              const canDelete =
                isAdmin || comment.author_id === currentUserId;
              const author = comment.author;

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    {author?.avatar_url ? (
                      <AvatarImage src={author.avatar_url} alt={author.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {author?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {author?.name || "알 수 없음"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500"
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
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            아직 댓글이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
