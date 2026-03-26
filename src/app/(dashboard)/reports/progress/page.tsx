import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/actions/reports";
import { ProgressLogList } from "@/components/features/reports/progress-log-list";

export const dynamic = "force-dynamic";

export default async function ProgressLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/login");

  const projectsResult = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">추진경과 관리</h1>
        <p className="text-muted-foreground">
          프로젝트별 추진경과를 등록하고 관리합니다.
        </p>
      </div>
      <ProgressLogList
        projects={(projectsResult.data ?? []) as Array<Record<string, unknown>>}
        currentMember={member as unknown as Record<string, unknown>}
      />
    </div>
  );
}
