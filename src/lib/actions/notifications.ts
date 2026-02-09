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

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("member_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

// 마감일 알림 생성 함수
export async function createDeadlineNotification(
  memberId: string,
  projectId: string,
  projectTitle: string,
  daysUntilDeadline: number
): Promise<NotificationFormState> {
  const supabase = await createClient();

  const deadlineText =
    daysUntilDeadline === 0
      ? "오늘"
      : daysUntilDeadline === 1
      ? "내일"
      : `${daysUntilDeadline}일 후`;

  const title = `마감일 알림: ${projectTitle}`;
  const message = `"${projectTitle}" 프로젝트의 마감일이 ${deadlineText}입니다.`;

  // 중복 알림 확인 (같은 날짜에 같은 프로젝트에 대한 알림이 있는지)
  const today = new Date().toISOString().split("T")[0];
  const { data: existingNotifications } = await supabase
    .from("notifications")
    .select("id")
    .eq("member_id", memberId)
    .eq("type", "deadline")
    .eq("link", `/research/${projectId}`)
    .gte("created_at", today);

  if (existingNotifications && existingNotifications.length > 0) {
    return { success: true }; // 이미 알림이 있으면 스킵
  }

  const { error } = await supabase.from("notifications").insert({
    member_id: memberId,
    type: "deadline",
    title,
    message,
    link: `/research/${projectId}`,
    is_read: false,
  } as never);

  if (error) {
    console.error("Create deadline notification error:", error);
    return { error: "마감일 알림 생성에 실패했습니다." };
  }

  return { success: true };
}

// 프로젝트 업데이트 알림 생성 함수
export async function createProjectUpdateNotification(
  memberId: string,
  projectId: string,
  projectTitle: string,
  updateType: string
): Promise<NotificationFormState> {
  const supabase = await createClient();

  const title = `프로젝트 업데이트: ${projectTitle}`;
  const message = `"${projectTitle}" 프로젝트가 ${updateType}되었습니다.`;

  const { error } = await supabase.from("notifications").insert({
    member_id: memberId,
    type: "project_update",
    title,
    message,
    link: `/research/${projectId}`,
    is_read: false,
  } as never);

  if (error) {
    console.error("Create project update notification error:", error);
    return { error: "프로젝트 업데이트 알림 생성에 실패했습니다." };
  }

  return { success: true };
}

// 관리자(교수)에게 활동 알림 전송
export async function notifyAdmins(params: {
  actorId: string;
  actorName: string;
  title: string;
  message: string;
  link: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: professors } = await supabase
      .from("members")
      .select("id")
      .eq("position", "professor");

    if (!professors || professors.length === 0) return;

    const targets = professors.filter(
      (p: { id: string }) => p.id !== params.actorId
    );

    if (targets.length === 0) return;

    const notifications = targets.map((p: { id: string }) => ({
      member_id: p.id,
      type: "project_update",
      title: params.title,
      message: params.message,
      link: params.link,
      is_read: false,
    }));

    await supabase.from("notifications").insert(notifications as never);
  } catch (error) {
    console.error("Admin notification error:", error);
  }
}

// 마감일 체크 및 알림 생성 (D-7, D-3, D-1, D-Day)
export async function checkAndCreateDeadlineNotifications(): Promise<{
  created: number;
  error?: string;
}> {
  const supabase = await createClient();

  // 현재 날짜 기준으로 D-7, D-3, D-1, D-Day 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDays = [7, 3, 1, 0]; // D-7, D-3, D-1, D-Day
  let createdCount = 0;

  for (const days of targetDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // 해당 날짜가 마감일인 프로젝트 조회
    const { data: projects, error: projectError } = await supabase
      .from("research_projects")
      .select(
        `
        id,
        title,
        target_date,
        project_members (
          member_id
        )
      `
      )
      .eq("target_date", targetDateStr)
      .in("status", ["preparing", "in_progress", "under_review", "revision"]);

    if (projectError) {
      console.error("Check deadline projects error:", projectError);
      continue;
    }

    if (!projects || projects.length === 0) continue;

    // 각 프로젝트의 멤버들에게 알림 생성
    type ProjectWithMembers = {
      id: string;
      title: string;
      target_date: string | null;
      project_members: { member_id: string }[];
    };

    for (const project of projects as ProjectWithMembers[]) {
      const members = project.project_members;
      if (!members || members.length === 0) continue;

      for (const member of members) {
        const result = await createDeadlineNotification(
          member.member_id,
          project.id,
          project.title,
          days
        );
        if (result.success) {
          createdCount++;
        }
      }
    }
  }

  return { created: createdCount };
}
