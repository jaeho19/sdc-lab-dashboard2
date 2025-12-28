import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate, getPositionLabel } from "@/lib/utils";
import {
  ArrowLeft,
  CheckSquare,
  Paperclip,
  Download,
  Edit,
  Trash2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LikeButton } from "@/components/features/mentoring/like-button";
import { CommentSection } from "@/components/features/mentoring/comment-section";
import { ProfessorComment } from "@/components/features/mentoring/professor-comment";
import { FileDownloadButton } from "@/components/features/mentoring/file-download-button";
import { DeletePostButton } from "@/components/features/mentoring/delete-post-button";
import { ShareButton } from "@/components/features/mentoring/share-button";

interface MentoringDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MentoringDetailPage({
  params,
}: MentoringDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 사용자 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentMemberId: string | null = null;
  let isAdmin = false;

  if (user?.email) {
    const { data: member } = await supabase
      .from("members")
      .select("id, position")
      .eq("email", user.email)
      .single();
    if (member) {
      const memberData = member as { id: string; position: string };
      currentMemberId = memberData.id;
      isAdmin = memberData.position === "professor";
    }
  }

  // 포스트 조회
  const { data: post } = await supabase
    .from("mentoring_posts")
    .select(
      `
      *,
      author:members!mentoring_posts_author_id_fkey (
        id,
        name,
        position,
        avatar_url,
        email
      )
    `
    )
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

  // 댓글 조회
  const { data: comments } = await supabase
    .from("mentoring_comments")
    .select(
      `
      *,
      author:members!mentoring_comments_author_id_fkey (
        id,
        name,
        position,
        avatar_url
      )
    `
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  // 파일 조회
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("entity_type", "mentoring")
    .eq("entity_id", id);

  // 사용자의 좋아요 여부 확인
  let userLiked = false;
  if (currentMemberId) {
    const { data: like } = await supabase
      .from("mentoring_likes")
      .select("id")
      .eq("post_id", id)
      .eq("member_id", currentMemberId)
      .single();
    userLiked = !!like;
  }

  const postData = post as {
    id: string;
    content: string;
    meeting_date: string | null;
    professor_comments: string | null;
    next_steps: string[] | null;
    likes_count: number;
    created_at: string;
    updated_at: string;
    author_id: string;
    author: {
      id: string;
      name: string;
      position: string;
      avatar_url: string | null;
      email: string;
    } | null;
  };

  interface CommentAuthor {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
  }

  interface CommentData {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author: CommentAuthor | null;
  }

  const commentList = ((comments || []) as CommentData[]).map((comment) => ({
    ...comment,
    author: comment.author
      ? {
          ...comment.author,
          avatar_url: comment.author.avatar_url,
        }
      : null,
  }));

  const fileList = (files || []) as Array<{
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size: number;
  }>;

  const isAuthor = currentMemberId === postData.author_id;
  const canEdit = isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mentoring">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">멘토링 기록</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href={`/mentoring/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
            </Link>
            {canDelete && <DeletePostButton postId={id} />}
          </div>
        )}
      </div>

      {/* Post Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Link href={`/members/${postData.author?.id}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={postData.author?.avatar_url || undefined}
                />
                <AvatarFallback className="bg-sidebar-primary text-white">
                  {postData.author ? getInitials(postData.author.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/members/${postData.author?.id}`}
                  className="font-semibold hover:underline"
                >
                  {postData.author?.name || "Unknown"}
                </Link>
                {postData.author && (
                  <Badge variant="outline">
                    {getPositionLabel(postData.author.position)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>작성일: {formatDate(postData.created_at)}</span>
                {postData.meeting_date && (
                  <span>· 미팅일: {formatDate(postData.meeting_date)}</span>
                )}
              </div>

              <div className="prose prose-sm max-w-none mb-4">
                <p className="whitespace-pre-wrap">{postData.content}</p>
              </div>

              {/* Next Steps */}
              {postData.next_steps && postData.next_steps.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">NEXT STEPS</span>
                  </div>
                  <ul className="space-y-2">
                    {postData.next_steps.map((step, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Professor Comments */}
              {postData.professor_comments && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2 text-primary">
                    교수님 코멘트
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {postData.professor_comments}
                  </p>
                </div>
              )}

              {/* Professor can add comment */}
              {isAdmin && !postData.professor_comments && (
                <ProfessorComment postId={id} />
              )}

              {/* Files */}
              {fileList.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    첨부파일 ({fileList.length})
                  </h4>
                  <div className="space-y-2">
                    {fileList.map((file) => (
                      <FileDownloadButton key={file.id} file={file} />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <LikeButton
                  postId={postData.id}
                  likesCount={postData.likes_count}
                  userLiked={userLiked}
                />
                <ShareButton postId={postData.id} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <CommentSection
        postId={id}
        comments={commentList}
        currentUserId={currentMemberId || undefined}
        isAdmin={isAdmin}
      />
    </div>
  );
}
