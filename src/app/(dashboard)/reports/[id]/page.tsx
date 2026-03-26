import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getReport, getSubProjects } from "@/lib/actions/reports";
import { ReportDetailView } from "@/components/features/reports/report-detail-view";

export const dynamic = "force-dynamic";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
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
      <ReportDetailView report={report} subProjects={subProjects} />
    </div>
  );
}
