"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ResearchFormState {
  error?: string;
  success?: boolean;
}

export async function createProject(
  prevState: ResearchFormState,
  formData: FormData
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const targetDate = formData.get("target_date") as string;
  const status = formData.get("status") as string;

  if (!title) {
    return { error: "프로젝트 제목을 입력해주세요." };
  }

  const { data: project, error } = (await supabase
    .from("research_projects")
    .insert({
      title,
      description: description || null,
      start_date: startDate || null,
      target_date: targetDate || null,
      status: status || "preparing",
      created_by: user.id,
    } as never)
    .select()
    .single()) as { data: { id: string } | null; error: unknown };

  if (error || !project) {
    console.error("Create project error:", error);
    return { error: "프로젝트 생성에 실패했습니다." };
  }

  revalidatePath("/research");
  redirect(`/research/${project.id}`);
}

export async function updateProject(
  projectId: string,
  prevState: ResearchFormState,
  formData: FormData
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const targetDate = formData.get("target_date") as string;
  const status = formData.get("status") as string;

  if (!title) {
    return { error: "프로젝트 제목을 입력해주세요." };
  }

  const { error } = (await supabase
    .from("research_projects")
    .update({
      title,
      description: description || null,
      start_date: startDate || null,
      target_date: targetDate || null,
      status: status || "preparing",
    } as never)
    .eq("id", projectId)) as { error: unknown };

  if (error) {
    console.error("Update project error:", error);
    return { error: "프로젝트 수정에 실패했습니다." };
  }

  revalidatePath("/research");
  revalidatePath(`/research/${projectId}`);
  redirect(`/research/${projectId}`);
}

export async function deleteProject(projectId: string): Promise<ResearchFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("research_projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error("Delete project error:", error);
    return { error: "프로젝트 삭제에 실패했습니다." };
  }

  revalidatePath("/research");
  redirect("/research");
}

export async function addMilestone(
  projectId: string,
  formData: FormData
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const weight = parseInt(formData.get("weight") as string) || 1;

  if (!title) {
    return { error: "마일스톤 제목을 입력해주세요." };
  }

  // Get current max order_index
  const { data: existingMilestones } = (await supabase
    .from("milestones")
    .select("order_index")
    .eq("project_id", projectId)
    .order("order_index", { ascending: false })
    .limit(1)) as { data: { order_index: number }[] | null };

  const nextIndex =
    existingMilestones && existingMilestones.length > 0
      ? existingMilestones[0].order_index + 1
      : 0;

  const { error } = (await supabase.from("milestones").insert({
    project_id: projectId,
    title,
    description: description || null,
    weight,
    order_index: nextIndex,
  } as never)) as { error: unknown };

  if (error) {
    console.error("Add milestone error:", error);
    return { error: "마일스톤 추가에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

export async function addChecklistItem(
  milestoneId: string,
  projectId: string,
  formData: FormData
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const content = formData.get("content") as string;

  if (!content) {
    return { error: "체크리스트 내용을 입력해주세요." };
  }

  // Get current max order_index
  const { data: existingItems } = (await supabase
    .from("checklist_items")
    .select("order_index")
    .eq("milestone_id", milestoneId)
    .order("order_index", { ascending: false })
    .limit(1)) as { data: { order_index: number }[] | null };

  const nextIndex =
    existingItems && existingItems.length > 0
      ? existingItems[0].order_index + 1
      : 0;

  const { error } = (await supabase.from("checklist_items").insert({
    milestone_id: milestoneId,
    content,
    order_index: nextIndex,
  } as never)) as { error: unknown };

  if (error) {
    console.error("Add checklist item error:", error);
    return { error: "체크리스트 추가에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

export async function toggleChecklistItem(
  itemId: string,
  projectId: string,
  isCompleted: boolean
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = (await supabase
    .from("checklist_items")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? user?.id : null,
    } as never)
    .eq("id", itemId)) as { error: unknown };

  if (error) {
    console.error("Toggle checklist item error:", error);
    return { error: "체크리스트 상태 변경에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

export async function addProjectMember(
  projectId: string,
  memberId: string,
  role: string
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const { error } = (await supabase.from("project_members").insert({
    project_id: projectId,
    member_id: memberId,
    role,
  } as never)) as { error: unknown };

  if (error) {
    console.error("Add project member error:", error);
    return { error: "멤버 추가에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

export async function removeProjectMember(
  projectId: string,
  memberId: string
): Promise<ResearchFormState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("member_id", memberId);

  if (error) {
    console.error("Remove project member error:", error);
    return { error: "멤버 제거에 실패했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}
