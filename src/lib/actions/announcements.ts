"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AnnouncementPriority } from "@/types/database.types";

export interface AnnouncementFormState {
  error?: string;
  success?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  author_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
  } | null;
}

// 공지사항 조회 (만료되지 않은 것만)
export async function getAnnouncements(limit?: number): Promise<Announcement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("announcements")
    .select(
      `
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
    `
    )
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Get announcements error:", error);
    return [];
  }

  return (data || []) as Announcement[];
}

// 단일 공지사항 조회
export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
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
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Get announcement error:", error);
    return null;
  }

  return data as Announcement;
}

// 공지사항 생성 (professor 전용)
export async function createAnnouncement(
  formData: FormData
): Promise<AnnouncementFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id, position")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  // professor 권한 확인
  if (member.position !== "professor") {
    return { error: "공지사항 작성 권한이 없습니다." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const priority = (formData.get("priority") as AnnouncementPriority) || "normal";
  const is_pinned = formData.get("is_pinned") === "true";
  const expires_at = formData.get("expires_at") as string | null;

  if (!title || !content) {
    return { error: "제목과 내용을 입력해주세요." };
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    content,
    priority,
    is_pinned,
    author_id: member.id,
    expires_at: expires_at || null,
  });

  if (error) {
    console.error("Create announcement error:", error);
    return { error: "공지사항 생성에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/announcements");
  return { success: true };
}

// 공지사항 수정 (professor 전용)
export async function updateAnnouncement(
  id: string,
  formData: FormData
): Promise<AnnouncementFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id, position")
    .eq("user_id", user.id)
    .single();

  if (!member || member.position !== "professor") {
    return { error: "공지사항 수정 권한이 없습니다." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const priority = formData.get("priority") as AnnouncementPriority;
  const is_pinned = formData.get("is_pinned") === "true";
  const expires_at = formData.get("expires_at") as string | null;

  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      content,
      priority,
      is_pinned,
      expires_at: expires_at || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Update announcement error:", error);
    return { error: "공지사항 수정에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/announcements");
  return { success: true };
}

// 공지사항 삭제 (professor 전용)
export async function deleteAnnouncement(
  id: string
): Promise<AnnouncementFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id, position")
    .eq("user_id", user.id)
    .single();

  if (!member || member.position !== "professor") {
    return { error: "공지사항 삭제 권한이 없습니다." };
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    console.error("Delete announcement error:", error);
    return { error: "공지사항 삭제에 실패했습니다." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/announcements");
  return { success: true };
}
