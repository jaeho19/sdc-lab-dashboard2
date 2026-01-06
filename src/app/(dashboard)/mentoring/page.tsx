"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  MessageCircle,
  Share2,
  MoreVertical,
  CheckSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LikeButton } from "@/components/features/mentoring/like-button";

interface MentoringComment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface MentoringPost {
  id: string;
  content: string;
  meeting_date: string | null;
  professor_comment: string | null;
  next_steps: string[] | null;
  likes_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
  } | null;
  comments: MentoringComment[];
  user_liked: boolean;
}

export default function MentoringPage() {
  const [posts, setPosts] = useState<MentoringPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // 현재 사용자 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let memberId: string | null = null;
    if (user?.email) {
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("email", user.email)
        .single();
      if (member) {
        memberId = (member as { id: string }).id;
        setCurrentUserId(memberId);
      }
    }

    // 게시물 조회
    let query = supabase
      .from("mentoring_posts")
      .select(
        `
        *,
        author:members!mentoring_posts_author_id_fkey (
          id,
          name,
          position,
          avatar_url
        ),
        comments:mentoring_comments (
          id,
          content,
          created_at,
          author:members (
            id,
            name,
            avatar_url
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.ilike("content", `%${searchQuery}%`);
    }

    const { data } = await query;

    if (data) {
      // 각 게시물에 대해 사용자의 좋아요 여부 확인
      const postsWithLikes = await Promise.all(
        (data as MentoringPost[]).map(async (post) => {
          if (memberId) {
            const { data: like } = await supabase
              .from("mentoring_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("member_id", memberId)
              .single();
            return { ...post, user_liked: !!like };
          }
          return { ...post, user_liked: false };
        })
      );
      setPosts(postsWithLikes);
    }

    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts();
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/mentoring/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mentoring Records</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            멘토링 기록은 각 멤버 페이지에서 작성할 수 있습니다
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm md:text-base"
          />
        </div>
      </form>

      {/* Posts List */}
      <div className="space-y-3 md:space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 md:py-12">
              <div className="text-center text-muted-foreground text-sm md:text-base">
                로딩 중...
              </div>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-12">
              <div className="text-center">
                <p className="text-muted-foreground text-sm md:text-base">
                  {searchQuery
                    ? "검색 결과가 없습니다."
                    : "멘토링 기록이 없습니다. 각 멤버 페이지에서 멘토링 기록을 작성해주세요."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card
              key={post.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
                <div className="flex items-start gap-2 md:gap-4">
                  <Link href={`/members/${post.author?.id}`}>
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarImage
                        src={post.author?.avatar_url || undefined}
                      />
                      <AvatarFallback className="bg-sidebar-primary text-white text-sm md:text-base">
                        {post.author ? getInitials(post.author.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    {/* Header with author and menu */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                        <Link
                          href={`/members/${post.author?.id}`}
                          className="font-semibold hover:underline text-sm md:text-base"
                        >
                          {post.author?.name || "Unknown"}
                        </Link>
                        {post.meeting_date && (
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {formatDate(post.meeting_date)}
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/mentoring/${post.id}`}>
                              상세 보기
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/mentoring/${post.id}/edit`}>
                              수정
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Content */}
                    <Link href={`/mentoring/${post.id}`}>
                      <p className="text-muted-foreground line-clamp-3 mb-2 md:mb-3 cursor-pointer hover:text-foreground transition-colors text-sm md:text-base">
                        {post.content}
                      </p>
                    </Link>

                    {/* Next Steps */}
                    {post.next_steps && post.next_steps.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-2 md:p-3 mb-2 md:mb-3">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <CheckSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                          <span className="font-medium text-xs md:text-sm">NEXT STEPS</span>
                        </div>
                        <ul className="space-y-0.5 md:space-y-1">
                          {post.next_steps.slice(0, 3).map((step, index) => (
                            <li
                              key={index}
                              className="text-xs md:text-sm text-muted-foreground flex items-start gap-1.5 md:gap-2"
                            >
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                          {post.next_steps.length > 3 && (
                            <li className="text-xs md:text-sm text-muted-foreground">
                              +{post.next_steps.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 md:gap-1 pt-2 border-t">
                      <LikeButton
                        postId={post.id}
                        likesCount={post.likes_count}
                        userLiked={post.user_liked}
                      />
                      <Link href={`/mentoring/${post.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 md:gap-2 h-8 px-2 md:px-3">
                          <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm">{post.comments?.length || 0}</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 md:gap-2 h-8 px-2 md:px-3"
                        onClick={() => handleShare(post.id)}
                      >
                        <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="text-xs md:text-sm hidden sm:inline">공유</span>
                      </Button>
                    </div>

                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t space-y-1.5 md:space-y-2">
                        {post.comments.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="flex items-start gap-1.5 md:gap-2">
                            <Avatar className="h-6 w-6 md:h-7 md:w-7">
                              <AvatarImage src={comment.author?.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-xs">
                                {comment.author ? getInitials(comment.author.name) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 bg-muted/50 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 flex-wrap">
                                <span className="text-xs md:text-sm font-medium">
                                  {comment.author?.name || "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {post.comments.length > 2 && (
                          <Link href={`/mentoring/${post.id}`}>
                            <p className="text-xs md:text-sm text-primary hover:underline pl-7 md:pl-9">
                              +{post.comments.length - 2}개 댓글 더보기
                            </p>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
