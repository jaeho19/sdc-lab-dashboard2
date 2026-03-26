"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  Minimize,
} from "lucide-react";
import type {
  ReportWithDetails,
  SubProject,
  ReportContentMatrix,
  ReportContentLogEntry,
  ReportTemplateSection,
} from "@/types/database";

interface PresentationModeProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
  onClose: () => void;
}

interface Slide {
  type: "content" | "extra";
  title?: string;
  subProjects?: SubProject[];
  section?: ReportTemplateSection;
  content?: ReportContentMatrix;
}

function splitIntoSlides(
  subProjects: SubProject[],
  report: ReportWithDetails,
  maxRowsPerSlide: number = 3
): Slide[] {
  const slides: Slide[] = [];
  const template = report.template;
  if (!template) return slides;

  // Find the progress_matrix section
  const matrixSection = template.sections.find(
    (s) => s.type === "progress_matrix"
  );

  if (matrixSection) {
    const matrixContent = report.content[matrixSection.id] as
      | ReportContentMatrix
      | undefined;
    const sorted = [...subProjects].sort((a, b) => a.sort_order - b.sort_order);

    for (let i = 0; i < sorted.length; i += maxRowsPerSlide) {
      const chunk = sorted.slice(i, i + maxRowsPerSlide);
      slides.push({
        type: "content",
        title: matrixSection.title,
        subProjects: chunk,
        section: matrixSection,
        content: matrixContent,
      });
    }
  }

  // Last slide: meetings, remarks, list, text sections
  const extraSections = template.sections.filter(
    (s) => s.type === "list" || s.type === "text"
  );
  if (extraSections.length > 0) {
    slides.push({
      type: "extra",
      title: "기타 사항",
    });
  }

  return slides;
}

export function PresentationMode({
  report,
  subProjects,
  onClose,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = useMemo(
    () => splitIntoSlides(subProjects, report),
    [subProjects, report]
  );

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, onClose]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      // Fullscreen may be blocked by browser policy
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      // Ignore if not in fullscreen
    }
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const currentSlideData = slides[currentSlide];

  const formatPeriod = () => {
    if (!report.period_start || !report.period_end) return "";
    const start = new Date(report.period_start);
    const end = new Date(report.period_end);
    return `${start.getMonth() + 1}.${start.getDate()} ~ ${end.getMonth() + 1}.${end.getDate()}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-lg font-semibold truncate">{report.title}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          {/* Title area */}
          <div className="text-center mb-8">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold">
              {report.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mt-1">
              보고기간 {formatPeriod()}
            </p>
          </div>

          {currentSlideData?.type === "content" && currentSlideData.section && (
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-slate-300 dark:border-slate-600 border-collapse text-lg md:text-xl lg:text-2xl">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border-2 border-slate-300 dark:border-slate-600 px-4 py-3 text-left font-semibold w-1/5">
                      업무구분
                    </th>
                    {currentSlideData.section.columns?.map((col) => (
                      <th
                        key={col.key}
                        className="border-2 border-slate-300 dark:border-slate-600 px-4 py-3 text-left font-semibold"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSlideData.subProjects?.map((sp) => {
                    const cellData = currentSlideData.content?.[sp.id];
                    return (
                      <tr key={sp.id}>
                        <td className="border-2 border-slate-300 dark:border-slate-600 px-4 py-3 font-medium align-top">
                          {sp.name}
                        </td>
                        {currentSlideData.section?.columns?.map((col) => {
                          const entries: ReportContentLogEntry[] =
                            (cellData?.[col.key] as ReportContentLogEntry[]) ?? [];
                          return (
                            <td
                              key={col.key}
                              className="border-2 border-slate-300 dark:border-slate-600 px-4 py-3 align-top"
                            >
                              {entries.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {entries.map((entry) => (
                                    <li key={entry.log_id}>{entry.text}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {currentSlideData?.type === "extra" && (
            <div className="space-y-6 text-lg md:text-xl lg:text-2xl">
              {report.template?.sections
                .filter((s) => s.type === "list" || s.type === "text")
                .map((section) => {
                  const sectionContent = report.content[section.id];
                  return (
                    <div key={section.id} className="space-y-2">
                      <h3 className="font-semibold border-b-2 border-slate-300 dark:border-slate-600 pb-2">
                        {section.title}
                      </h3>
                      {section.type === "list" && sectionContent && "items" in sectionContent && (
                        <ul className="list-disc list-inside space-y-1 pl-2">
                          {(sectionContent.items as ReportContentLogEntry[]).map(
                            (item) => (
                              <li key={item.log_id}>{item.text}</li>
                            )
                          )}
                        </ul>
                      )}
                      {section.type === "text" && sectionContent && "text" in sectionContent && (
                        <p className="whitespace-pre-wrap">
                          {(sectionContent as { text: string }).text || "(내용 없음)"}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center px-6 py-3 border-t bg-white dark:bg-slate-900 shrink-0">
        <span className="text-sm text-muted-foreground">
          슬라이드 {currentSlide + 1} / {totalSlides}
        </span>
      </div>
    </div>
  );
}
