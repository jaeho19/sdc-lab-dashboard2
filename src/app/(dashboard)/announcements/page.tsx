import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AnnouncementPriority, MemberPosition } from "@/types/database.types";

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

export default async function AnnouncementsPage() {
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

  // 공지사항 조회 (만료되지 않은 것만)
  const now = new Date().toISOString();
  const { data: announcements } = await supabase
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
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const announcementList = (announcements || []) as Array<{
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
  }>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">공지사항</h1>
          <p className="text-muted-foreground mt-1">연구실 공지사항을 확인하세요.</p>
        </div>
        {isProfessor && (
          <Link href="/announcements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 공지
            </Button>
          </Link>
        )}
      </div>

      {/* Announcements List */}
      {announcementList.length > 0 ? (
        <div className="space-y-3">
          {announcementList.map((announcement) => {
            const config = priorityConfig[announcement.priority];
            const IconComponent = config.icon;

            return (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block"
              >
                <Card className={`transition-colors hover:bg-muted/50 ${config.bgClass}`}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      {/* 아이콘 */}
                      <div className="flex-shrink-0 mt-0.5">
                        {announcement.is_pinned ? (
                          <Pin className="h-5 w-5 text-primary" />
                        ) : IconComponent ? (
                          <IconComponent className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Megaphone className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base md:text-lg">
                            {announcement.title}
                          </h3>
                          {announcement.priority !== "normal" && (
                            <Badge variant={config.badge} className="text-xs">
                              {config.label}
                            </Badge>
                          )}
                          {announcement.is_pinned && (
                            <Badge variant="outline" className="text-xs">
                              고정
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {announcement.author && (
                            <>
                              <span>{announcement.author.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatDate(announcement.created_at)}</span>
                          <span>({formatRelativeTime(announcement.created_at)})</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">공지사항이 없습니다</p>
            <p className="text-muted-foreground mt-1">
              새로운 공지사항이 등록되면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
