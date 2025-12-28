"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CalendarEvent } from "@/types/database";

export interface CalendarFormState {
  error?: string;
  success?: boolean;
}

export async function createEvent(
  prevState: CalendarFormState,
  formData: FormData
): Promise<CalendarFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const startDate = formData.get("start_date") as string;
  const startTime = formData.get("start_time") as string;
  const endDate = formData.get("end_date") as string;
  const endTime = formData.get("end_time") as string;
  const allDay = formData.get("all_day") === "true";
  const isPublic = formData.get("is_public") === "true";
  const memberId = formData.get("member_id") as string;

  if (!title || !startDate) {
    return { error: "제목과 시작일을 입력해주세요." };
  }

  const startDateTime = allDay
    ? `${startDate}T00:00:00`
    : `${startDate}T${startTime || "00:00"}:00`;

  const endDateTime = endDate
    ? allDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime || "23:59"}:59`
    : null;

  const { error } = (await supabase.from("calendar_events").insert({
    title,
    description: description || null,
    category: category || "other",
    start_date: startDateTime,
    end_date: endDateTime,
    all_day: allDay,
    is_public: isPublic,
    member_id: memberId || null,
    created_by: user.id,
  } as never)) as { error: unknown };

  if (error) {
    console.error("Create event error:", error);
    return { error: "일정 생성에 실패했습니다." };
  }

  revalidatePath("/calendar");
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  prevState: CalendarFormState,
  formData: FormData
): Promise<CalendarFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const startDate = formData.get("start_date") as string;
  const startTime = formData.get("start_time") as string;
  const endDate = formData.get("end_date") as string;
  const endTime = formData.get("end_time") as string;
  const allDay = formData.get("all_day") === "true";
  const isPublic = formData.get("is_public") === "true";
  const memberId = formData.get("member_id") as string;

  if (!title || !startDate) {
    return { error: "제목과 시작일을 입력해주세요." };
  }

  const startDateTime = allDay
    ? `${startDate}T00:00:00`
    : `${startDate}T${startTime || "00:00"}:00`;

  const endDateTime = endDate
    ? allDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime || "23:59"}:59`
    : null;

  const { error } = (await supabase
    .from("calendar_events")
    .update({
      title,
      description: description || null,
      category: category || "other",
      start_date: startDateTime,
      end_date: endDateTime,
      all_day: allDay,
      is_public: isPublic,
      member_id: memberId || null,
    } as never)
    .eq("id", eventId)) as { error: unknown };

  if (error) {
    console.error("Update event error:", error);
    return { error: "일정 수정에 실패했습니다." };
  }

  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<CalendarFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = (await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)) as { error: unknown };

  if (error) {
    console.error("Delete event error:", error);
    return { error: "일정 삭제에 실패했습니다." };
  }

  revalidatePath("/calendar");
  return { success: true };
}

export async function getEventsForMonth(
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const { data } = (await supabase
    .from("calendar_events")
    .select("*")
    .gte("start_date", startOfMonth.toISOString())
    .lte("start_date", endOfMonth.toISOString())
    .order("start_date", { ascending: true })) as {
    data: CalendarEvent[] | null;
  };

  return data || [];
}
