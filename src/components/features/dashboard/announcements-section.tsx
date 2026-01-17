"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, AlertTriangle, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import type { AnnouncementPriority } from "@/types/database.types";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  author?: {
    id: string;
    name: string;
  } | null;
  expires_at: string | null;
  created_at: string;
}

interface AnnouncementsSectionProps {
  announcements: AnnouncementItem[];
  maxItems?: number;
}

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

export function AnnouncementsSection({
  announcements,
  maxItems = 3,
}: AnnouncementsSectionProps) {
  // 고정 공지 우선, 그 다음 우선순위별, 최신순 정렬
  const sortedAnnouncements = [...announcements]
    .sort((a, b) => {
      // 고정 공지 우선
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      // 우선순위 정렬 (urgent > important > normal)
      const priorityOrder: Record<AnnouncementPriority, number> = {
        urgent: 0,
        important: 1,
        normal: 2,
      };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // 최신순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, maxItems);

  if (sortedAnnouncements.length === 0) {
    return null; // 공지가 없으면 섹션 숨김
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Megaphone className="h-4 w-4 md:h-5 md:w-5" />
          공지사항
          <Badge variant="secondary" className="ml-2 text-xs">
            {announcements.length}건
          </Badge>
        </CardTitle>
        {announcements.length > maxItems && (
          <Link
            href="/announcements"
            className="text-xs md:text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className="space-y-3">
          {sortedAnnouncements.map((announcement) => {
            const config = priorityConfig[announcement.priority];
            const IconComponent = config.icon;

            return (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block"
              >
                <div
                  className={`p-3 md:p-4 rounded-lg border transition-colors hover:bg-muted/50 ${config.bgClass}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 고정/우선순위 아이콘 */}
                    <div className="flex-shrink-0 mt-0.5">
                      {announcement.is_pinned ? (
                        <Pin className="h-4 w-4 text-primary" />
                      ) : IconComponent ? (
                        <IconComponent className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base truncate">
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {announcement.author && (
                          <span>{announcement.author.name}</span>
                        )}
                        <span>•</span>
                        <span>{formatRelativeTime(announcement.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
