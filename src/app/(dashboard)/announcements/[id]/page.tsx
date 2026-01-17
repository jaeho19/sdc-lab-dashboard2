import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Pin, AlertTriangle, AlertCircle, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AnnouncementPriority } from "@/types/database.types";
import { DeleteAnnouncementButton } from "@/components/features/announcements/delete-announcement-button";

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 우선순위별 스타일 설정
const priorityConfig = {
  urgent: {
    badge: "destructive" as const,
    icon: AlertTriangle,
    bgClass: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
    label: "긴급",
  },
  important: {
    badge: "default" as const,
    icon: AlertCircle,
    bgClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
    label: "중요",
  },
  normal: {
    badge: "secondary" as const,
    icon: null,
    bgClass: "",
    label: "일반",
  },
};

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnnouncementDetailPage({
  params,
}: AnnouncementDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 사용자 정보 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isProfessor = false;
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("position")
      .eq("id", user.id)
      .single() as { data: { position: string } | null; error: unknown };
    isProfessor = member?.position === "professor";
  }

  // 공지사항 조회
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      priority,
      is_pinned,
      author_id,
      expires_at,
      created_at,
      updated_at,
      author:members (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !announcement) {
    notFound();
  }

  const typedAnnouncement = announcement as {
    id: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    author_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    author: { id: string; name: string } | null;
  };

  const config = priorityConfig[typedAnnouncement.priority];
  const IconComponent = config.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/announcements">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          공지사항 목록
        </Button>
      </Link>

      {/* Announcement Detail */}
      <Card className={config.bgClass}>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* 아이콘 */}
              <div className="flex-shrink-0 mt-1">
                {typedAnnouncement.is_pinned ? (
                  <Pin className="h-6 w-6 text-primary" />
                ) : IconComponent ? (
                  <IconComponent className="h-6 w-6 text-amber-600" />
                ) : (
                  <Megaphone className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* 제목 및 뱃지 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl md:text-2xl">
                    {typedAnnouncement.title}
                  </CardTitle>
                  {typedAnnouncement.priority !== "normal" && (
                    <Badge variant={config.badge}>
                      {config.label}
                    </Badge>
                  )}
                  {typedAnnouncement.is_pinned && (
                    <Badge variant="outline">
                      고정
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {typedAnnouncement.author && (
                    <>
                      <span>{typedAnnouncement.author.name}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDate(typedAnnouncement.created_at)}</span>
                  <span>({formatRelativeTime(typedAnnouncement.created_at)})</span>
                </div>
              </div>
            </div>

            {/* 수정/삭제 버튼 (교수만) */}
            {isProfessor && (
              <div className="flex items-center gap-2">
                <Link href={`/announcements/${typedAnnouncement.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                </Link>
                <DeleteAnnouncementButton id={typedAnnouncement.id} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 내용 */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {typedAnnouncement.content}
            </p>
          </div>

          {/* 만료일 정보 */}
          {typedAnnouncement.expires_at && (
            <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
              <span>만료일: {formatDate(typedAnnouncement.expires_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
