"use client";

import { useActionState, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import {
  updateMentoringPost,
  deleteMentoringPost,
  type MentoringFormState,
} from "@/lib/actions/mentoring";
import { createClient } from "@/lib/supabase/client";
import type { MentoringPost } from "@/types/database";

const initialState: MentoringFormState = {};

export default function EditMentoringPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<MentoringPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const updatePostWithId = updateMentoringPost.bind(null, postId);
  const [state, formAction, isPending] = useActionState(
    updatePostWithId,
    initialState
  );

  useEffect(() => {
    async function fetchPost() {
      const supabase = createClient();
      const { data } = await supabase
        .from("mentoring_posts")
        .select("*")
        .eq("id", postId)
        .single();

      setPost(data);
      setLoading(false);
    }

    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    if (!confirm("정말 이 멘토링 기록을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    await deleteMentoringPost(postId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">멘토링 기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link href={`/mentoring/${postId}`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>멘토링 기록 수정</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {state.error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="meeting_date">미팅 날짜 *</Label>
              <Input
                id="meeting_date"
                name="meeting_date"
                type="date"
                defaultValue={post.meeting_date}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">미팅 내용 *</Label>
              <textarea
                id="content"
                name="content"
                className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="오늘 멘토링에서 논의한 내용을 작성하세요..."
                defaultValue={post.content}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_steps">다음 단계 (줄바꿈으로 구분)</Label>
              <textarea
                id="next_steps"
                name="next_steps"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="다음에 해야 할 일들을 줄바꿈으로 구분하여 작성하세요"
                defaultValue={post.next_steps?.join("\n") || ""}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
              <Link href={`/mentoring/${postId}`}>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
