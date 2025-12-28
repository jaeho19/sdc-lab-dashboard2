import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalsList } from "./approvals-list";

export default async function AdminApprovalsPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 관리자 권한 확인
  const { data: currentMember } = await supabase
    .from("members")
    .select("position")
    .eq("user_id", user.id)
    .single();

  const memberData = currentMember as { position: string } | null;

  if (!memberData || memberData.position !== "professor") {
    redirect("/dashboard");
  }

  // 승인 대기 중인 멤버 조회
  const { data: pendingMembers } = await supabase
    .from("members")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">회원 승인 관리</h1>
        <p className="text-muted-foreground mt-2">
          가입 신청한 연구원들을 승인하거나 거절할 수 있습니다.
        </p>
      </div>

      <ApprovalsList members={pendingMembers || []} />
    </div>
  );
}
