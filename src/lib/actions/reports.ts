"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./research";
import type {
  ProgressLogStatus,
  ProgressLogType,
  ReportContent,
  ReportStatus,
} from "@/types/database";

// ── Projects & Sub-projects ──

export async function getProjects(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_active", true)
    .order("code");
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getSubProjects(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_projects")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) return { error: error.message };
  return { success: true, data };
}

// ── Progress Logs (추진경과) ──

export async function getProgressLogs(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  subProjectId?: string;
  assigneeId?: string;
  status?: ProgressLogStatus[];
  logType?: ProgressLogType[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("progress_logs")
    .select("*, sub_projects(id, code, name, sort_order)")
    .eq("project_id", params.projectId)
    .gte("log_date", params.startDate)
    .lte("log_date", params.endDate)
    .order("log_date", { ascending: true });

  if (params.subProjectId) {
    query = query.eq("sub_project_id", params.subProjectId);
  }
  if (params.assigneeId) {
    query = query.eq("assignee_id", params.assigneeId);
  }
  if (params.status?.length) {
    query = query.in("status", params.status);
  }
  if (params.logType?.length) {
    query = query.in("log_type", params.logType);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getPersonalProgressLogs(params: {
  assigneeId: string;
  startDate: string;
  endDate: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("progress_logs")
    .select(`
      *,
      sub_projects(id, code, name, sort_order),
      projects!inner(id, code, name, short_name)
    `)
    .eq("assignee_id", params.assigneeId)
    .gte("log_date", params.startDate)
    .lte("log_date", params.endDate)
    .order("log_date", { ascending: true });
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function addProgressLog(params: {
  projectId: string;
  subProjectId?: string;
  title: string;
  description?: string;
  logDate: string;
  logType: ProgressLogType;
  status: ProgressLogStatus;
  assigneeId?: string;
  assigneeName?: string;
  hoursSpent?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const memberData = member as { id: string } | null;
  if (!memberData) return { error: "Member not found" };

  const { data, error } = await supabase
    .from("progress_logs")
    .insert({
      project_id: params.projectId,
      sub_project_id: params.subProjectId || null,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      log_date: params.logDate,
      log_type: params.logType,
      status: params.status,
      assignee_id: params.assigneeId || memberData.id,
      assignee_name: params.assigneeName || null,
      hours_spent: params.hoursSpent || null,
      created_by: memberData.id,
    } as never)
    .select()
    .single();
  if (error) return { error: error.message };
  const insertedData = data as { id: string };
  revalidatePath("/reports");
  return { success: true, id: insertedData.id };
}

export async function updateProgressLog(
  logId: string,
  params: Partial<{
    subProjectId: string | null;
    title: string;
    description: string | null;
    logDate: string;
    logType: ProgressLogType;
    status: ProgressLogStatus;
    assigneeId: string | null;
    assigneeName: string | null;
    hoursSpent: number | null;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (params.subProjectId !== undefined) updateData.sub_project_id = params.subProjectId;
  if (params.title !== undefined) updateData.title = params.title.trim();
  if (params.description !== undefined) updateData.description = params.description?.trim() || null;
  if (params.logDate !== undefined) updateData.log_date = params.logDate;
  if (params.logType !== undefined) updateData.log_type = params.logType;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.assigneeId !== undefined) updateData.assignee_id = params.assigneeId;
  if (params.assigneeName !== undefined) updateData.assignee_name = params.assigneeName;
  if (params.hoursSpent !== undefined) updateData.hours_spent = params.hoursSpent;

  const { error } = await supabase
    .from("progress_logs")
    .update(updateData as never)
    .eq("id", logId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteProgressLog(logId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("progress_logs")
    .delete()
    .eq("id", logId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}

// ── Report Templates (양식) ──

export async function getReportTemplates(params?: {
  projectId?: string;
  scope?: "project" | "personal";
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("report_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (params?.projectId) {
    query = query.or(`project_id.eq.${params.projectId},project_id.is.null`);
  }
  if (params?.scope) {
    query = query.eq("scope", params.scope);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

// ── Reports (보고서) ──

export async function getReports(params?: {
  projectId?: string;
  templateId?: string;
  status?: ReportStatus;
  assigneeId?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select(`
      *,
      report_templates(id, name, period_type, scope),
      projects(id, name, short_name)
    `)
    .order("period_start", { ascending: false });

  if (params?.projectId) query = query.eq("project_id", params.projectId);
  if (params?.templateId) query = query.eq("template_id", params.templateId);
  if (params?.status) query = query.eq("status", params.status);
  if (params?.assigneeId) query = query.eq("assignee_id", params.assigneeId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function getReport(reportId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      report_templates(*, projects(id, name, short_name)),
      projects(id, code, name, short_name)
    `)
    .eq("id", reportId)
    .single();
  if (error) return { error: error.message };
  return { success: true, data };
}

export async function createReport(params: {
  templateId: string;
  projectId?: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  assigneeId?: string;
  content: ReportContent;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const memberData = member as { id: string } | null;
  if (!memberData) return { error: "Member not found" };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      template_id: params.templateId,
      project_id: params.projectId || null,
      title: params.title,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      assignee_id: params.assigneeId || null,
      content: params.content as never,
      status: "draft",
      created_by: memberData.id,
    } as never)
    .select()
    .single();
  if (error) return { error: error.message };
  const insertedData = data as { id: string };
  revalidatePath("/reports");
  return { success: true, id: insertedData.id };
}

export async function updateReport(
  reportId: string,
  params: Partial<{
    title: string;
    content: ReportContent;
    status: ReportStatus;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (params.title !== undefined) updateData.title = params.title;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.status !== undefined) {
    updateData.status = params.status;
    if (params.status === "submitted") {
      updateData.submitted_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData as never)
    .eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

export async function deleteReport(reportId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId);
  if (error) return { error: error.message };
  revalidatePath("/reports");
  return { success: true };
}
