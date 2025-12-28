import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Calendar, MessageSquare, Heart, FileText } from "lucide-react";
import { NotificationList } from "@/components/features/notifications/notification-list";
import type { Notification } from "@/types/database";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
      </div>
    );
  }

  const { data: notificationsData } = (await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)) as { data: Notification[] | null };

  const notifications = notificationsData || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-muted-foreground mt-1">알림 목록</p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 ? (
        <NotificationList notifications={notifications} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-slate-900">
              알림이 없습니다
            </p>
            <p className="text-muted-foreground mt-1">
              새로운 알림이 도착하면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
