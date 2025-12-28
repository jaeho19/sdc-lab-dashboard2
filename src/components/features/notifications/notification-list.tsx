"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Calendar,
  MessageSquare,
  Heart,
  FileText,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "@/lib/actions/notifications";
import type { Notification } from "@/types/database";

interface NotificationListProps {
  notifications: Notification[];
}

const typeIcons: Record<string, React.ReactNode> = {
  deadline: <Calendar className="h-5 w-5 text-red-500" />,
  comment: <MessageSquare className="h-5 w-5 text-blue-500" />,
  like: <Heart className="h-5 w-5 text-pink-500" />,
  project_update: <FileText className="h-5 w-5 text-green-500" />,
};

export function NotificationList({ notifications }: NotificationListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    setLoadingId(id);
    await markAsRead(id);
    setLoadingId(null);
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await markAllAsRead();
    setIsMarkingAll(false);
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    await deleteNotification(id);
    setLoadingId(null);
  };

  const handleDeleteAll = async () => {
    if (!confirm("정말 모든 알림을 삭제하시겠습니까?")) return;
    setIsDeletingAll(true);
    await deleteAllNotifications();
    setIsDeletingAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 h-4 w-4" />
                )}
                모두 읽음
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              전체 삭제
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 py-4 ${
                !notification.is_read ? "bg-blue-50/50 -mx-4 px-4" : ""
              }`}
            >
              {/* Icon */}
              <div className="mt-1">
                {typeIcons[notification.type] || (
                  <Bell className="h-5 w-5 text-slate-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {notification.link && (
                  <Link href={notification.link}>
                    <Button variant="ghost" size="sm">
                      보기
                    </Button>
                  </Link>
                )}
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={loadingId === notification.id}
                  >
                    {loadingId === notification.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(notification.id)}
                  disabled={loadingId === notification.id}
                  className="text-muted-foreground hover:text-red-500"
                >
                  {loadingId === notification.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
