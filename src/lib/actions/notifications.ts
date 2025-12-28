"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Notification } from "@/types/database";

export interface NotificationFormState {
  error?: string;
  success?: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = (await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)) as { data: Notification[] | null };

  return data || [];
}

export async function markAsRead(
  notificationId: string
): Promise<NotificationFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("notifications")
    .update({ is_read: true } as never)
    .eq("id", notificationId)
    .eq("member_id", user.id)) as { error: unknown };

  if (error) {
    console.error("Mark as read error:", error);
    return { error: "알림 읽음 처리에 실패했습니다." };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsRead(): Promise<NotificationFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("notifications")
    .update({ is_read: true } as never)
    .eq("member_id", user.id)
    .eq("is_read", false)) as { error: unknown };

  if (error) {
    console.error("Mark all as read error:", error);
    return { error: "알림 읽음 처리에 실패했습니다." };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(
  notificationId: string
): Promise<NotificationFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("member_id", user.id)) as { error: unknown };

  if (error) {
    console.error("Delete notification error:", error);
    return { error: "알림 삭제에 실패했습니다." };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteAllNotifications(): Promise<NotificationFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("notifications")
    .delete()
    .eq("member_id", user.id)) as { error: unknown };

  if (error) {
    console.error("Delete all notifications error:", error);
    return { error: "알림 삭제에 실패했습니다." };
  }

  revalidatePath("/notifications");
  return { success: true };
}
