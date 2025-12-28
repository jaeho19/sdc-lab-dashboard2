"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CalendarCategory } from "@/types/database.types";

export type CalendarFormState = {
  error?: string;
  success?: boolean;
};

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  all_day: boolean;
  category: CalendarCategory;
  is_public: boolean;
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Unauthorized" };
  }

  // Get member_id from user email
  const { data: memberData } = await supabase
    .from("members")
    .select("id")
    .eq("email", user.email)
    .single();

  const member = memberData as { id: string } | null;
  const memberId = member?.id;

  const insertData = {
    title: input.title,
    description: input.description,
    start_date: input.start_date,
    end_date: input.end_date,
    all_day: input.all_day,
    category: input.category,
    is_public: input.is_public,
    created_by: memberId || null,
    member_id: input.is_public ? null : memberId,
  };

  const { data, error } = await supabase
    .from("calendar_events")
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    return { error: error.message };
  }

  revalidatePath("/calendar");
  return { data };
}

export async function updateCalendarEvent(
  id: string,
  input: Partial<CalendarEventInput>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.start_date !== undefined) updateData.start_date = input.start_date;
  if (input.end_date !== undefined) updateData.end_date = input.end_date;
  if (input.all_day !== undefined) updateData.all_day = input.all_day;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.is_public !== undefined) {
    updateData.is_public = input.is_public;
    if (input.is_public === true) {
      updateData.member_id = null;
    }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating event:", error);
    return { error: error.message };
  }

  revalidatePath("/calendar");
  return { data };
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting event:", error);
    return { error: error.message };
  }

  revalidatePath("/calendar");
  return { success: true };
}

export async function updateEventDates(
  id: string,
  start_date: string,
  end_date?: string | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const updateData = {
    start_date,
    end_date,
  };

  const { error } = await supabase
    .from("calendar_events")
    .update(updateData as never)
    .eq("id", id);

  if (error) {
    console.error("Error updating event dates:", error);
    return { error: error.message };
  }

  revalidatePath("/calendar");
  return { success: true };
}

// Form-compatible wrapper functions for useActionState
function parseFormData(formData: FormData): CalendarEventInput {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const startDateStr = formData.get("start_date") as string;
  const startTime = formData.get("start_time") as string | null;
  const endDateStr = formData.get("end_date") as string | null;
  const endTime = formData.get("end_time") as string | null;
  const allDay = formData.get("all_day") === "true";
  const category = (formData.get("category") as CalendarCategory) || "other";
  const isPublic = formData.get("is_public") === "true";

  // Build datetime strings
  const start_date = allDay || !startTime
    ? `${startDateStr}T00:00:00`
    : `${startDateStr}T${startTime}:00`;

  let end_date: string | null = null;
  if (endDateStr) {
    end_date = allDay || !endTime
      ? `${endDateStr}T23:59:59`
      : `${endDateStr}T${endTime}:00`;
  }

  return {
    title,
    description,
    start_date,
    end_date,
    all_day: allDay,
    category,
    is_public: isPublic,
  };
}

export async function createCalendarEventForm(
  _prevState: CalendarFormState,
  formData: FormData
): Promise<CalendarFormState> {
  const input = parseFormData(formData);
  const result = await createCalendarEvent(input);

  if (result.error) {
    return { error: result.error };
  }
  return { success: true };
}

export async function updateCalendarEventForm(
  id: string,
  _prevState: CalendarFormState,
  formData: FormData
): Promise<CalendarFormState> {
  const input = parseFormData(formData);
  const result = await updateCalendarEvent(id, input);

  if (result.error) {
    return { error: result.error };
  }
  return { success: true };
}
