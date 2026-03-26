"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { PrintLayout } from "./print-layout";
import type { ReportWithDetails, SubProject } from "@/types/database";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportWithDetails;
  subProjects: SubProject[];
}

export function PrintDialog({
  open,
  onOpenChange,
  report,
  subProjects,
}: PrintDialogProps) {
  const [format, setFormat] = useState<"basic" | "official">("official");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [includeSections, setIncludeSections] = useState({
    info: true,
    progressTable: true,
    meetings: true,
    remarks: false,
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handleSectionToggle = useCallback(
    (key: keyof typeof includeSections) => {
      setIncludeSections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    []
  );

  const handlePrint = useCallback(() => {
    // Inject dynamic print orientation style
    const styleId = "print-orientation-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; } }`;

    window.print();
  }, [orientation]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>인쇄 설정</DialogTitle>
            <DialogDescription>
              인쇄 형식과 포함할 섹션을 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Format selection */}
            <div className="space-y-2">
              <Label>인쇄 형식</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={format === "basic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("basic")}
                  className="flex-1"
                >
                  간편 양식
                </Button>
                <Button
                  type="button"
                  variant={format === "official" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("official")}
                  className="flex-1"
                >
                  공식 양식
                </Button>
              </div>
            </div>

            {/* Orientation selection */}
            <div className="space-y-2">
              <Label>용지 방향</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={orientation === "portrait" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrientation("portrait")}
                  className="flex-1"
                >
                  세로
                </Button>
                <Button
                  type="button"
                  variant={orientation === "landscape" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrientation("landscape")}
                  className="flex-1"
                >
                  가로
                </Button>
              </div>
            </div>

            {/* Section toggles */}
            <div className="space-y-2">
              <Label>포함 섹션</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeSections.info}
                    onCheckedChange={() => handleSectionToggle("info")}
                  />
                  <span className="text-sm">보고서 정보 (제목, 기간)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeSections.progressTable}
                    onCheckedChange={() =>
                      handleSectionToggle("progressTable")
                    }
                  />
                  <span className="text-sm">추진경과 테이블</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeSections.meetings}
                    onCheckedChange={() => handleSectionToggle("meetings")}
                  />
                  <span className="text-sm">회의/보고 사항</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeSections.remarks}
                    onCheckedChange={() => handleSectionToggle("remarks")}
                  />
                  <span className="text-sm">비고/특이사항</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              인쇄
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden print layout rendered in DOM for @media print */}
      <div ref={printRef} className="hidden print:block">
        <PrintLayout
          report={report}
          subProjects={subProjects}
          format={format}
          includeSections={includeSections}
        />
      </div>
    </>
  );
}
