import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportList } from "@/components/features/reports/report-list";
import { getReports, getReportTemplates, getProjects } from "@/lib/actions/reports";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
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

  const [reportsResult, templatesResult, projectsResult] = await Promise.all([
    getReports(),
    getReportTemplates(),
    getProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">보고서</h1>
          <p className="text-muted-foreground">
            주간/월간 보고서를 관리하고 자동 생성합니다.
          </p>
        </div>
      </div>
      <ReportList
        reports={(reportsResult.data ?? []) as Array<Record<string, unknown>>}
        templates={(templatesResult.data ?? []) as Array<Record<string, unknown>>}
        projects={(projectsResult.data ?? []) as Array<Record<string, unknown>>}
        currentMember={member as unknown as Record<string, unknown>}
      />
    </div>
  );
}
