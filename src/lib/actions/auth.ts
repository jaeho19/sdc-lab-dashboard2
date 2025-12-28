"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Member, MemberPosition, EmploymentType, MemberStatus } from "@/types/database";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function signUp(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const position = (formData.get("position") as MemberPosition) || "researcher";
  const employmentType = (formData.get("employmentType") as EmploymentType) || "full-time";

  if (!email || !password || !name) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 최소 6자 이상이어야 합니다." };
  }

  // 1. Supabase Auth에 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        name_en: nameEn || null,
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { error: "이미 등록된 이메일입니다." };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "회원가입에 실패했습니다." };
  }

  // 2. members 테이블에 레코드 생성 (Admin 클라이언트로 RLS 우회)
  const adminClient = createAdminClient();
  const { error: memberError } = await adminClient.from("members").insert({
    id: authData.user.id,
    email,
    name,
    name_en: nameEn || null,
    position,
    employment_type: employmentType,
    status: "pending" as MemberStatus,
  } as never);

  if (memberError) {
    console.error("Member creation error:", memberError);
    return { error: "회원 정보 저장에 실패했습니다." };
  }

  redirect("/pending-approval");
}

export async function signIn(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "로그인에 실패했습니다." };
  }

  // 사용자 상태 확인
  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", data.user.id)
    .single() as { data: { status: MemberStatus } | null; error: unknown };

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  if (member.status === "pending") {
    redirect("/pending-approval");
  }

  if (member.status === "leave" || member.status === "graduated") {
    await supabase.auth.signOut();
    return { error: "비활성화된 계정입니다. 관리자에게 문의하세요." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function approveMember(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data: currentMember } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single() as { data: { position: MemberPosition } | null; error: unknown };

  if (currentMember?.position !== "professor") {
    return { error: "권한이 없습니다." };
  }

  const { error } = await supabase
    .from("members")
    .update({ status: "active" } as never)
    .eq("id", memberId);

  if (error) {
    return { error: "승인에 실패했습니다." };
  }

  revalidatePath("/admin/approvals");
  return { success: true };
}

export async function rejectMember(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data: currentMember } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single() as { data: { position: MemberPosition } | null; error: unknown };

  if (currentMember?.position !== "professor") {
    return { error: "권한이 없습니다." };
  }

  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    return { error: "거절에 실패했습니다." };
  }

  revalidatePath("/admin/approvals");
  return { success: true };
}

// 관리자가 직접 회원 등록
export async function adminCreateMember(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data: currentMember } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single() as { data: { position: MemberPosition } | null; error: unknown };

  if (currentMember?.position !== "professor") {
    return { error: "관리자 권한이 필요합니다." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const position = (formData.get("position") as MemberPosition) || "researcher";
  const employmentType = (formData.get("employmentType") as EmploymentType) || "full-time";

  if (!email || !password || !name) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 최소 6자 이상이어야 합니다." };
  }

  // Admin 클라이언트로 사용자 생성 (이메일 인증 없이)
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 이메일 인증 완료 상태로 생성
    user_metadata: {
      name,
      name_en: nameEn || null,
    },
  });

  if (authError) {
    console.error("Auth creation error:", authError);
    if (authError.message.includes("already")) {
      return { error: "이미 등록된 이메일입니다." };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "사용자 생성에 실패했습니다." };
  }

  // members 테이블에 레코드 생성
  const { error: memberError } = await adminClient.from("members").insert({
    id: authData.user.id,
    email,
    name,
    name_en: nameEn || null,
    position,
    employment_type: employmentType,
    status: "active" as MemberStatus, // 바로 활성 상태로 등록
  } as never);

  if (memberError) {
    console.error("Member creation error:", memberError);
    // 실패 시 auth user도 삭제
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "회원 정보 저장에 실패했습니다." };
  }

  revalidatePath("/admin/members");
  return { success: true };
}
