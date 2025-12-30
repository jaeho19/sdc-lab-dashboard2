"use server";

import { createClient } from "./server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MemberPosition, EmploymentType, Database } from "@/types/database.types";

type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];

export type AuthResult = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
};

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // 회원 상태 확인
  const { data: memberData } = await supabase
    .from("members")
    .select("status")
    .eq("email", email)
    .single();

  const member = memberData as { status: string } | null;

  if (!member) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  if (member.status === "pending") {
    return { success: true, redirectTo: "/pending-approval" };
  }

  if (member.status === "leave") {
    return { error: "휴학 상태입니다. 관리자에게 문의하세요." };
  }

  return { success: true, redirectTo: "/dashboard" };
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;
  const position = formData.get("position") as MemberPosition;
  const employmentType = formData.get("employmentType") as EmploymentType;
  const enrollmentYear = formData.get("enrollmentYear") as string;
  const expectedGraduationYear = formData.get("expectedGraduationYear") as string;

  // 유효성 검사
  if (!email || !password || !name || !position || !employmentType) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상이어야 합니다." };
  }

  // 이메일 중복 확인
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("email", email)
    .single();

  if (existingMember) {
    return { error: "이미 등록된 이메일입니다." };
  }

  // 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: "회원가입 중 오류가 발생했습니다: " + authError.message };
  }

  if (!authData.user) {
    return { error: "사용자 생성에 실패했습니다." };
  }

  // 멤버 레코드 생성 (members.id = auth.users.id)
  const memberData: MemberInsert = {
    id: authData.user.id,
    name,
    email,
    position,
    employment_type: employmentType,
    enrollment_year: enrollmentYear ? parseInt(enrollmentYear) : null,
    expected_graduation_year: expectedGraduationYear
      ? parseInt(expectedGraduationYear)
      : null,
    status: "pending",
  };
  const { error: memberError } = await supabase
    .from("members")
    .insert(memberData as never);

  if (memberError) {
    return { error: "회원 정보 저장 중 오류가 발생했습니다." };
  }

  redirect("/pending-approval");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function approveMember(memberId: string): Promise<AuthResult> {
  const supabase = await createClient();

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: currentMemberData } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single();

  const currentMember = currentMemberData as { position: string } | null;

  if (!currentMember || currentMember.position !== "professor") {
    return { error: "관리자 권한이 필요합니다." };
  }

  // 멤버 승인
  const { error } = await supabase
    .from("members")
    .update({ status: "active" } as never)
    .eq("id", memberId);

  if (error) {
    return { error: "승인 처리 중 오류가 발생했습니다." };
  }

  revalidatePath("/admin/approvals");
  return { success: true };
}

export async function rejectMember(memberId: string): Promise<AuthResult> {
  const supabase = await createClient();

  // 관리자 권한 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: currentMemberData2 } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single();

  const currentMember2 = currentMemberData2 as { position: string } | null;

  if (!currentMember2 || currentMember2.position !== "professor") {
    return { error: "관리자 권한이 필요합니다." };
  }

  // 멤버 정보 조회 (members.id = auth.users.id)
  const { data: memberToReject } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .single();

  if (!memberToReject) {
    return { error: "회원을 찾을 수 없습니다." };
  }

  // 멤버 레코드 삭제
  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    return { error: "거절 처리 중 오류가 발생했습니다." };
  }

  revalidatePath("/admin/approvals");
  return { success: true };
}

export async function updateMemberProfile(
  memberId: string,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 본인 확인 또는 관리자 확인
  const { data: currentMember } = await supabase
    .from("members")
    .select("id, position")
    .eq("id", user.id)
    .single() as { data: { id: string; position: string } | null };

  if (!currentMember) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const isAdmin = currentMember.position === "professor";
  const isOwner = currentMember.id === memberId;

  if (!isAdmin && !isOwner) {
    return { error: "본인의 정보만 수정할 수 있습니다." };
  }

  // 폼 데이터 추출
  const admissionDate = formData.get("admission_date") as string;
  const graduationDate = formData.get("graduation_date") as string;
  const interests = formData.get("interests") as string;

  // 업데이트 데이터 구성
  const updateData: Record<string, string | null> = {
    admission_date: admissionDate || null,
    graduation_date: graduationDate || null,
    interests: interests || null,
  };

  const { error } = await supabase
    .from("members")
    .update(updateData as never)
    .eq("id", memberId);

  if (error) {
    return { error: "정보 수정 중 오류가 발생했습니다: " + error.message };
  }

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
