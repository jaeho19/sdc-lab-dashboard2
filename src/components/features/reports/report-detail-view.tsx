"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Monitor,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type {
  ReportStatus,
  ReportWithDetails,
  SubProject,
  ReportContentMatrix,
  ReportContentLogEntry,
  ReportContentList,
  ReportTemplateSection,
} from "@/types/database";
import { PresentationMode } from "./presentation-mode";
import { PrintDialog } from "./print-dialog";

const statusConfig: Record<
  ReportStatus,
  { label: string; variant: "secondary" | "default" | "outline" }
> = {
  draft: { label: "작성중", variant: "secondary" },
  submitted: { label: "제출됨", variant: "default" },
  approved: { label: "승인됨", variant: "outline" },
};

interface ReportDetailViewProps {
  report: Record<string, unknown>;
  subProjects: unknown[];
}

export function ReportDetailView({
  report,
  subProjects,
}: ReportDetailViewProps) {
  const router = useRouter();
  const [showPresentation, setShowPresentation] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const status = report.status as ReportStatus;
  const config = statusConfig[status] || statusConfig.draft;
  const template = report.report_templates as Record<string, unknown> | null;
  const project = report.projects as Record<string, unknown> | null;
  const sections = (template?.sections as ReportTemplateSection[]) ?? [];
  const content = (report.content as Record<string, unknown>) ?? {};

  const sortedSubProjects = useMemo(() => {
    return [...(subProjects as SubProject[])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [subProjects]);

  const reportAsWithDetails = report as unknown as ReportWithDetails;

  return (
    <>
      {/* Back Button */}
      <Link href="/reports">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          보고서 목록
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {report.title as string}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {project && (
              <>
                <span>
                  {(project.short_name as string) ||
                    (project.name as string)}
                </span>
                <span>|</span>
              </>
            )}
            <span>
              {report.period_start as string} ~ {report.period_end as string}
            </span>
            <span>|</span>
            <span>생성: {formatDate(report.created_at as string)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/reports/${report.id as string}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              편집
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresentation(true)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            발표 모드
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrint(true)}
          >
            <Printer className="h-4 w-4 mr-2" />
            인쇄
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {sections.map((section) => {
        const sectionContent = content[section.id];

        if (section.type === "progress_matrix") {
          const matrixData = sectionContent as
            | ReportContentMatrix
            | undefined;

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/5 font-semibold">
                        업무구분
                      </TableHead>
                      {section.columns?.map((col) => (
                        <TableHead key={col.key} className="font-semibold">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSubProjects.map((sp) => {
                      const cellData = matrixData?.[sp.id] as
                        | Record<string, ReportContentLogEntry[]>
                        | undefined;
                      return (
                        <TableRow key={sp.id}>
                          <TableCell className="font-medium align-top">
                            {sp.name}
                          </TableCell>
                          {section.columns?.map((col) => {
                            const entries: ReportContentLogEntry[] =
                              cellData?.[col.key] ?? [];
                            return (
                              <TableCell
                                key={col.key}
                                className="align-top"
                              >
                                {entries.length > 0 ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {entries.map((entry) => (
                                      <li
                                        key={entry.log_id}
                                        className="text-sm"
                                      >
                                        {entry.text}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        }

        if (section.type === "list") {
          const listData = sectionContent as ReportContentList | undefined;

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {listData?.items && listData.items.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2">
                    {listData.items.map((item) => (
                      <li key={item.log_id} className="text-sm">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">(내용 없음)</p>
                )}
              </CardContent>
            </Card>
          );
        }

        if (section.type === "text") {
          const textData = sectionContent as { text: string } | undefined;

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {textData?.text ? (
                  <p className="text-sm whitespace-pre-wrap">{textData.text}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">(내용 없음)</p>
                )}
              </CardContent>
            </Card>
          );
        }

        return null;
      })}

      {/* Presentation Mode */}
      {showPresentation && (
        <PresentationMode
          report={reportAsWithDetails}
          subProjects={subProjects as SubProject[]}
          onClose={() => setShowPresentation(false)}
        />
      )}

      {/* Print Dialog */}
      <PrintDialog
        open={showPrint}
        onOpenChange={setShowPrint}
        report={reportAsWithDetails}
        subProjects={subProjects as SubProject[]}
      />
    </>
  );
}
