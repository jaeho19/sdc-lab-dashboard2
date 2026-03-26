"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateReport } from "@/lib/actions/reports";
import type {
  SubProject,
  ReportContentLogEntry,
  ReportContentMatrix,
  ReportContentList,
  ReportTemplateSection,
  ReportContent,
} from "@/types/database";

interface ReportEditFormProps {
  report: Record<string, unknown>;
  subProjects: unknown[];
}

export function ReportEditForm({ report, subProjects }: ReportEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(report.title as string);
  const [content, setContent] = useState<ReportContent>(
    (report.content as ReportContent) ?? {}
  );

  const template = report.report_templates as Record<string, unknown> | null;
  const sections = (template?.sections as ReportTemplateSection[]) ?? [];
  const reportId = report.id as string;

  const sortedSubProjects = useMemo(() => {
    return [...(subProjects as SubProject[])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }, [subProjects]);

  // Update matrix cell content
  const updateMatrixCell = useCallback(
    (sectionId: string, subProjectId: string, columnKey: string, value: string) => {
      setContent((prev) => {
        const sectionData = (prev[sectionId] ?? {}) as ReportContentMatrix;
        const cellData = sectionData[subProjectId] ?? {};
        const existingEntries = (cellData[columnKey] as ReportContentLogEntry[] | undefined) ?? [];

        // Parse text lines into entries, preserving existing log_ids where possible
        const lines = value
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const newEntries: ReportContentLogEntry[] = lines.map((text, i) => ({
          log_id: existingEntries[i]?.log_id ?? `manual-${Date.now()}-${i}`,
          text,
        }));

        return {
          ...prev,
          [sectionId]: {
            ...sectionData,
            [subProjectId]: {
              ...cellData,
              [columnKey]: newEntries,
            },
          },
        };
      });
    },
    []
  );

  // Update list items
  const updateListItems = useCallback(
    (sectionId: string, value: string) => {
      setContent((prev) => {
        const lines = value
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const existingItems =
          ((prev[sectionId] as ReportContentList)?.items as ReportContentLogEntry[] | undefined) ?? [];

        const newItems: ReportContentLogEntry[] = lines.map((text, i) => ({
          log_id: existingItems[i]?.log_id ?? `manual-${Date.now()}-${i}`,
          text,
        }));

        return {
          ...prev,
          [sectionId]: { items: newItems },
        };
      });
    },
    []
  );

  // Update text content
  const updateText = useCallback((sectionId: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [sectionId]: { text: value },
    }));
  }, []);

  // Get cell text as newline-separated string
  const getCellText = (
    sectionId: string,
    subProjectId: string,
    columnKey: string
  ): string => {
    const sectionData = content[sectionId] as ReportContentMatrix | undefined;
    const cellData = sectionData?.[subProjectId];
    const entries = (cellData?.[columnKey] as ReportContentLogEntry[] | undefined) ?? [];
    return entries.map((e) => e.text).join("\n");
  };

  // Get list items as newline-separated string
  const getListText = (sectionId: string): string => {
    const sectionData = content[sectionId] as ReportContentList | undefined;
    const items = sectionData?.items ?? [];
    return items.map((item) => item.text).join("\n");
  };

  // Get text content
  const getTextContent = (sectionId: string): string => {
    const sectionData = content[sectionId] as { text?: string } | undefined;
    return sectionData?.text ?? "";
  };

  const handleSave = useCallback(
    async (newStatus?: "submitted") => {
      setSaving(true);
      setError(null);

      try {
        const params: Parameters<typeof updateReport>[1] = {
          title,
          content,
        };
        if (newStatus) {
          params.status = newStatus;
        }

        const result = await updateReport(reportId, params);

        if (result.error) {
          setError(result.error);
          return;
        }

        router.push(`/reports/${reportId}`);
        router.refresh();
      } catch (err) {
        console.error("Save report error:", err);
        setError("저장 중 오류가 발생했습니다.");
      } finally {
        setSaving(false);
      }
    },
    [title, content, reportId, router]
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">보고서 제목</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="보고서 제목"
        />
      </div>

      {/* Sections */}
      {sections.map((section) => {
        if (section.type === "progress_matrix") {
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
                    {sortedSubProjects.map((sp) => (
                      <TableRow key={sp.id}>
                        <TableCell className="font-medium align-top">
                          {sp.name}
                        </TableCell>
                        {section.columns?.map((col) => (
                          <TableCell key={col.key} className="align-top p-2">
                            <Textarea
                              value={getCellText(
                                section.id,
                                sp.id,
                                col.key
                              )}
                              onChange={(e) =>
                                updateMatrixCell(
                                  section.id,
                                  sp.id,
                                  col.key,
                                  e.target.value
                                )
                              }
                              placeholder="항목별로 줄바꿈으로 구분"
                              rows={3}
                              className="min-h-[60px] text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        }

        if (section.type === "list") {
          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={getListText(section.id)}
                  onChange={(e) => updateListItems(section.id, e.target.value)}
                  placeholder="항목별로 줄바꿈으로 구분하세요"
                  rows={5}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  한 줄에 하나의 항목을 입력하세요.
                </p>
              </CardContent>
            </Card>
          );
        }

        if (section.type === "text") {
          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={getTextContent(section.id)}
                  onChange={(e) => updateText(section.id, e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={4}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          );
        }

        return null;
      })}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/reports/${reportId}`)}
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
          {(report.status as string) === "draft" && (
            <Button
              onClick={() => handleSave("submitted")}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              제출
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
