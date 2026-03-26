import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getReport, getSubProjects } from "@/lib/actions/reports";
import { ReportEditForm } from "@/components/features/reports/report-edit-form";

export const dynamic = "force-dynamic";

interface ReportEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportEditPage({
  params,
}: ReportEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getReport(id);
  if (result.error || !result.data) notFound();

  const report = result.data as Record<string, unknown>;

  let subProjects: unknown[] = [];
  if (report.project_id) {
    const spResult = await getSubProjects(report.project_id as string);
    subProjects = (spResult.data as unknown[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">보고서 편집</h1>
        <p className="text-muted-foreground">{report.title as string}</p>
      </div>
      <ReportEditForm report={report} subProjects={subProjects} />
    </div>
  );
}
