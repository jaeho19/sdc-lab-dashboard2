"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MILESTONE_STAGES } from "@/lib/utils";
import { createProjectUpdateNotification } from "@/lib/actions/notifications";

export type ProjectFormData = {
  title: string;
  category: string;
  project_type?: string;
  description?: string;
  target_journal?: string;
  deadline?: string;
  status: string;
  submission_status?: string;
};

export type ActionResult = {
  error?: string;
  success?: boolean;
  id?: string;
  data?: unknown;
};

// 프로젝트 생성 (기본 마일스톤 및 체크리스트 포함)
export async function createProject(
  formData: ProjectFormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회 (email로 조회)
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", user.email)
    .single();

  const memberData = member as { id: string } | null;

  if (!memberData) {
    return { error: "연구원 정보를 찾을 수 없습니다. 관리자에게 문의하세요." };
  }

  // 프로젝트 생성
  const { data: project, error } = await supabase
    .from("research_projects")
    .insert({
      title: formData.title,
      category: formData.category,
      project_type: formData.project_type || "general",
      description: formData.description || null,
      target_journal: formData.target_journal || null,
      target_date: formData.deadline || null,
      status: formData.status,
      overall_progress: 0,
      created_by: memberData.id,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("Project creation error:", error);
    return { error: "프로젝트 생성 중 오류가 발생했습니다." };
  }

  const projectData = project as { id: string };

  // 프로젝트 생성자를 first_author로 project_members에 추가
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: projectData.id,
      member_id: memberData.id,
      role: "first_author",
    } as never);

  if (memberError) {
    console.error("Project member creation error:", memberError);
  }

  // 6단계 마일스톤 및 체크리스트 생성
  for (let i = 0; i < MILESTONE_STAGES.length; i++) {
    const stage = MILESTONE_STAGES[i];

    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .insert({
        project_id: projectData.id,
        title: `${i + 1}단계: ${stage.label}`,
        description: stage.key,
        weight: stage.weight,
        order_index: i + 1,
        progress: 0,
      } as never)
      .select()
      .single();

    if (milestoneError) {
      console.error("Milestone creation error:", milestoneError);
      continue;
    }

    const milestoneData = milestone as { id: string };

    // 체크리스트 항목 생성
    const checklistItems = stage.checklist.map((content, index) => ({
      milestone_id: milestoneData.id,
      content,
      is_completed: false,
      order_index: index + 1,
    }));

    const { error: checklistError } = await supabase
      .from("checklist_items")
      .insert(checklistItems as never);

    if (checklistError) {
      console.error("Checklist creation error:", checklistError);
    }
  }

  revalidatePath("/research");
  return { success: true, id: projectData.id };
}

// 프로젝트 업데이트
export async function updateProject(
  id: string,
  formData: Partial<ProjectFormData>
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 기존 프로젝트 정보 조회 (상태 변경 확인용)
  const { data: existingProject } = await supabase
    .from("research_projects")
    .select("title, status")
    .eq("id", id)
    .single();

  const existing = existingProject as { title: string; status: string } | null;

  const updateData: Record<string, unknown> = {};
  if (formData.title !== undefined) updateData.title = formData.title;
  if (formData.category !== undefined) updateData.category = formData.category;
  if (formData.project_type !== undefined) updateData.project_type = formData.project_type;
  if (formData.description !== undefined) updateData.description = formData.description || null;
  if (formData.target_journal !== undefined) updateData.target_journal = formData.target_journal || null;
  if (formData.deadline !== undefined) updateData.target_date = formData.deadline || null;
  if (formData.status !== undefined) updateData.status = formData.status;
  if (formData.submission_status !== undefined) updateData.submission_status = formData.submission_status;

  const { error } = await supabase
    .from("research_projects")
    .update(updateData as never)
    .eq("id", id);

  if (error) {
    return { error: "프로젝트 수정 중 오류가 발생했습니다." };
  }

  // 상태 변경 시 프로젝트 멤버들에게 알림 발송
  if (formData.status !== undefined && existing && formData.status !== existing.status) {
    const statusLabels: Record<string, string> = {
      preparing: "준비 중",
      in_progress: "진행 중",
      under_review: "심사 중",
      revision: "수정 중",
      completed: "완료",
      on_hold: "보류",
    };

    const updateType = `상태가 "${statusLabels[formData.status] || formData.status}"(으)로 변경`;

    // 프로젝트 멤버 조회
    const { data: members } = await supabase
      .from("project_members")
      .select("member_id")
      .eq("project_id", id);

    if (members) {
      for (const member of members as { member_id: string }[]) {
        // 자신에게는 알림을 보내지 않음
        if (member.member_id !== user.id) {
          await createProjectUpdateNotification(
            member.member_id,
            id,
            existing.title,
            updateType
          );
        }
      }
    }
  }

  revalidatePath(`/research/${id}`);
  revalidatePath("/research");
  return { success: true };
}

// 프로젝트 삭제 (관리자 또는 프로젝트 생성자)
export async function deleteProject(id: string, redirectPath?: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자 정보 조회 (email로 조회)
  const { data: member } = await supabase
    .from("members")
    .select("id, position")
    .eq("email", user.email)
    .single();

  const memberData = member as { id: string; position: string } | null;

  if (!memberData) {
    return { error: "연구원 정보를 찾을 수 없습니다." };
  }

  const isAdmin = memberData.position === "professor";

  // 프로젝트 생성자 확인
  const { data: project } = await supabase
    .from("research_projects")
    .select("created_by")
    .eq("id", id)
    .single();

  const projectData = project as { created_by: string } | null;
  const isCreator = projectData?.created_by === user.id;

  // 관리자 또는 생성자만 삭제 가능
  if (!isAdmin && !isCreator) {
    return { error: "프로젝트를 삭제할 권한이 없습니다." };
  }

  // Use service role client to bypass RLS for deletion
  const adminClient = createServiceRoleClient();

  // 1. 프로젝트 멤버 삭제
  await adminClient
    .from("project_members")
    .delete()
    .eq("project_id", id);

  // 2. 마일스톤 조회 및 체크리스트 삭제
  const { data: milestones } = await adminClient
    .from("milestones")
    .select("id")
    .eq("project_id", id);

  if (milestones && milestones.length > 0) {
    for (const milestone of milestones as { id: string }[]) {
      await adminClient
        .from("checklist_items")
        .delete()
        .eq("milestone_id", milestone.id);
    }
  }

  // 3. 마일스톤 삭제
  await adminClient
    .from("milestones")
    .delete()
    .eq("project_id", id);

  // 4. 주간 목표 삭제
  await adminClient
    .from("weekly_goals")
    .delete()
    .eq("project_id", id);

  // 5. 저자 정보 삭제
  await adminClient
    .from("project_authors")
    .delete()
    .eq("project_id", id);

  // 6. 프로젝트 삭제
  const { error } = await adminClient
    .from("research_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Project deletion error:", error);
    return { error: "프로젝트 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/research");
  revalidatePath("/dashboard");
  revalidatePath("/members");
  if (redirectPath) {
    revalidatePath(redirectPath);
    redirect(redirectPath);
  } else {
    redirect("/research");
  }
}

// 체크리스트 항목 토글
export async function toggleChecklistItem(
  itemId: string,
  isCompleted: boolean,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("checklist_items")
    .update({
      is_completed: isCompleted,
    } as never)
    .eq("id", itemId);

  if (error) {
    return { error: "체크리스트 항목 업데이트 중 오류가 발생했습니다." };
  }

  // 진행률 재계산 (서버 사이드)
  await recalculateProgress(projectId);

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 진행률 재계산
async function recalculateProgress(projectId: string): Promise<void> {
  const supabase = await createClient();

  // 모든 마일스톤과 체크리스트 조회
  const { data: milestones } = await supabase
    .from("milestones")
    .select(`
      id,
      weight,
      checklist_items (
        is_completed
      )
    `)
    .eq("project_id", projectId);

  if (!milestones) return;

  let totalProgress = 0;

  for (const milestone of milestones as { id: string; weight: number; checklist_items: { is_completed: boolean }[] }[]) {
    const items = milestone.checklist_items || [];
    if (items.length === 0) continue;

    const completedCount = items.filter((item) => item.is_completed).length;
    const milestoneProgress = (completedCount / items.length) * milestone.weight;
    totalProgress += milestoneProgress;
  }

  // 프로젝트 진행률 업데이트
  await supabase
    .from("research_projects")
    .update({ overall_progress: Math.round(totalProgress * 10) / 10 } as never)
    .eq("id", projectId);
}

// 마일스톤 메모 업데이트
export async function updateMilestoneNotes(
  milestoneId: string,
  notes: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("milestones")
    .update({ notes: notes || null } as never)
    .eq("id", milestoneId);

  if (error) {
    return { error: "메모 저장 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 저자 추가
export async function addProjectAuthor(
  projectId: string,
  name: string,
  role: string,
  responsibilities?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 저자 수 조회
  const { count } = await supabase
    .from("project_authors")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data, error } = await supabase
    .from("project_authors")
    .insert({
      project_id: projectId,
      name,
      role,
      responsibilities: responsibilities || null,
      sort_order: (count || 0) + 1,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("Author creation error:", error);
    return { error: "저자 추가 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true, data };
}

// 저자 업데이트
export async function updateProjectAuthor(
  authorId: string,
  updates: { name?: string; role?: string; responsibilities?: string },
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("project_authors")
    .update(updates as never)
    .eq("id", authorId);

  if (error) {
    return { error: "저자 정보 수정 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 저자 삭제
export async function deleteProjectAuthor(
  authorId: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("project_authors")
    .delete()
    .eq("id", authorId);

  if (error) {
    return { error: "저자 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 현재 단계 설정
export async function setCurrentMilestone(
  milestoneId: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 모든 마일스톤의 is_current를 false로
  await supabase
    .from("milestones")
    .update({ is_current: false } as never)
    .eq("project_id", projectId);

  // 선택한 마일스톤을 현재로 설정
  const { error } = await supabase
    .from("milestones")
    .update({ is_current: true } as never)
    .eq("id", milestoneId);

  if (error) {
    return { error: "현재 단계 설정 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// ============================================
// 주간 목표 관련 액션
// ============================================

// 주간 목표 추가
export async function addWeeklyGoal(
  projectId: string,
  content: string,
  deadline: string,
  linkedStage?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 목표 수 조회
  const { count } = await supabase
    .from("weekly_goals")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data, error } = await supabase
    .from("weekly_goals")
    .insert({
      project_id: projectId,
      content,
      deadline,
      linked_stage: linkedStage || null,
      is_completed: false,
      sort_order: (count || 0) + 1,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("Weekly goal creation error:", error);
    console.error("Error details - code:", error.code, "message:", error.message, "details:", error.details);

    if (error.code === "42501") {
      return { error: "권한이 없습니다. 프로젝트 멤버 또는 생성자만 목표를 추가할 수 있습니다." };
    }
    return { error: `주간 목표 추가 중 오류가 발생했습니다: ${error.message}` };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true, data };
}

// 주간 목표 토글 (완료/미완료)
export async function toggleWeeklyGoal(
  goalId: string,
  isCompleted: boolean,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("weekly_goals")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    } as never)
    .eq("id", goalId);

  if (error) {
    return { error: "주간 목표 업데이트 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 주간 목표 삭제
export async function deleteWeeklyGoal(
  goalId: string,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("weekly_goals")
    .delete()
    .eq("id", goalId);

  if (error) {
    return { error: "주간 목표 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// 주간 목표 수정
export async function updateWeeklyGoal(
  goalId: string,
  projectId: string,
  content: string,
  deadline: string,
  linkedStage?: string | null
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!content.trim()) {
    return { error: "목표 내용을 입력해주세요." };
  }

  if (!deadline) {
    return { error: "마감일을 선택해주세요." };
  }

  const { error } = await supabase
    .from("weekly_goals")
    .update({
      content: content.trim(),
      deadline,
      linked_stage: linkedStage || null,
    } as never)
    .eq("id", goalId);

  if (error) {
    console.error("Weekly goal update error:", error);
    return { error: "주간 목표 수정 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// ============================================
// 마일스톤 일정 관련 액션
// ============================================

// 마일스톤 일정 업데이트
export async function updateMilestoneDates(
  milestoneId: string,
  startDate: string | null,
  endDate: string | null,
  projectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("milestones")
    .update({
      start_date: startDate || null,
      end_date: endDate || null,
    } as never)
    .eq("id", milestoneId);

  if (error) {
    return { error: "마일스톤 일정 업데이트 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// ============================================
// 연구 흐름도 관련 액션
// ============================================

// 연구 흐름도 업데이트
export async function updateFlowchart(
  projectId: string,
  flowchartMd: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("research_projects")
    .update({
      flowchart_md: flowchartMd || null,
    } as never)
    .eq("id", projectId);

  if (error) {
    console.error("Flowchart update error:", error);
    return { error: "연구 흐름도 저장 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  return { success: true };
}

// ============================================
// 투고 상태 관련 액션
// ============================================

// 투고 상태 업데이트
export async function updateSubmissionStatus(
  projectId: string,
  submissionStatus: string,
  targetJournal?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const updateData: Record<string, unknown> = {
    submission_status: submissionStatus,
  };

  // 투고 전 → 투고 상태로 변경 시 submitted_at 설정
  if (submissionStatus !== "not_submitted") {
    const { data: project } = await supabase
      .from("research_projects")
      .select("submission_status, submitted_at")
      .eq("id", projectId)
      .single();

    const projectData = project as { submission_status: string; submitted_at: string | null } | null;
    if (projectData && projectData.submission_status === "not_submitted" && !projectData.submitted_at) {
      updateData.submitted_at = new Date().toISOString();
    }
  }

  // 타겟 저널 업데이트
  if (targetJournal !== undefined) {
    updateData.target_journal = targetJournal || null;
  }

  const { error } = await supabase
    .from("research_projects")
    .update(updateData as never)
    .eq("id", projectId);

  if (error) {
    console.error("Submission status update error:", error);
    return { error: "투고 상태 변경 중 오류가 발생했습니다." };
  }

  revalidatePath(`/research/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================
// 즐겨찾기 관련 액션
// ============================================

// 즐겨찾기 상태 확인
export async function checkFavoriteStatus(projectId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!member) {
    return false;
  }

  const memberData = member as { id: string };

  const { data } = await supabase
    .from("research_project_favorites")
    .select("id")
    .eq("user_id", memberData.id)
    .eq("project_id", projectId)
    .single();

  return !!data;
}

// 즐겨찾기 토글
export async function toggleFavoriteProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!member) {
    return { error: "사용자 정보를 찾을 수 없습니다." };
  }

  const memberData = member as { id: string };

  // 현재 즐겨찾기 상태 확인
  const { data: existing } = await supabase
    .from("research_project_favorites")
    .select("id")
    .eq("user_id", memberData.id)
    .eq("project_id", projectId)
    .single();

  if (existing) {
    // 즐겨찾기 해제
    const { error } = await supabase
      .from("research_project_favorites")
      .delete()
      .eq("id", (existing as { id: string }).id);

    if (error) {
      console.error("Favorite deletion error:", error);
      return { error: "즐겨찾기 해제 중 오류가 발생했습니다." };
    }

    revalidatePath(`/research/${projectId}`);
    return { success: true, data: { isFavorite: false } };
  } else {
    // 즐겨찾기 추가
    const { error } = await supabase
      .from("research_project_favorites")
      .insert({
        user_id: memberData.id,
        project_id: projectId,
      } as never);

    if (error) {
      console.error("Favorite insertion error:", error);
      return { error: "즐겨찾기 추가 중 오류가 발생했습니다." };
    }

    revalidatePath(`/research/${projectId}`);
    return { success: true, data: { isFavorite: true } };
  }
}

// 즐겨찾기한 프로젝트 목록 조회
export async function getFavoriteProjects(): Promise<{
  error?: string;
  data?: { id: string; title: string; category: string }[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자의 member 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!member) {
    return { error: "사용자 정보를 찾을 수 없습니다." };
  }

  const memberData = member as { id: string };

  // 즐겨찾기한 프로젝트 ID 조회
  const { data: favorites, error: favError } = await supabase
    .from("research_project_favorites")
    .select("project_id")
    .eq("user_id", memberData.id)
    .order("created_at", { ascending: false });

  if (favError) {
    console.error("Favorite projects fetch error:", favError);
    return { error: "즐겨찾기 목록 조회 중 오류가 발생했습니다." };
  }

  if (!favorites || favorites.length === 0) {
    return { data: [] };
  }

  // 프로젝트 정보 조회
  const projectIds = (favorites as { project_id: string }[]).map((f) => f.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from("research_projects")
    .select("id, title, category")
    .in("id", projectIds);

  if (projectsError) {
    console.error("Projects fetch error:", projectsError);
    return { error: "프로젝트 정보 조회 중 오류가 발생했습니다." };
  }

  // 즐겨찾기 순서대로 정렬
  const orderedProjects = projectIds
    .map((id) => (projects as { id: string; title: string; category: string }[]).find((p) => p.id === id))
    .filter((p): p is { id: string; title: string; category: string } => p !== undefined);

  return { data: orderedProjects };
}
