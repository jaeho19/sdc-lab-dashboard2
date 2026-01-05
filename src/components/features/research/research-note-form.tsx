"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, Plus, Upload, Eye, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { createResearchNote, updateResearchNote } from "@/lib/actions/research-notes";
import { MILESTONE_STAGE_LABEL } from "@/lib/constants";
import type { MilestoneStage } from "@/types/database.types";

// 8단계 연구 단계
const MILESTONE_STAGES: MilestoneStage[] = [
  "literature_review",
  "methodology",
  "data_collection",
  "analysis",
  "draft_writing",
  "submission",
  "review_revision",
  "publication",
];

interface Milestone {
  id: string;
  stage: MilestoneStage;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  stage?: MilestoneStage;
  milestone_id?: string;
}

interface ResearchNoteFormProps {
  projectId: string;
  milestones?: Milestone[];
  note?: ResearchNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ResearchNoteForm({
  projectId,
  milestones = [],
  note,
  open,
  onOpenChange,
  onSuccess,
}: ResearchNoteFormProps) {
  const isEdit = !!note;

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [keywords, setKeywords] = useState<string[]>(note?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [stage, setStage] = useState<MilestoneStage>(note?.stage || "literature_review");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "split">("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().replace(/^#/, "");
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !stage) return;

    setSaving(true);
    setError(null);

    // 선택한 stage에 해당하는 마일스톤 찾기
    const matchingMilestone = milestones.find(m => m.stage === stage);

    try {
      if (isEdit && note) {
        const result = await updateResearchNote(note.id, {
          title: title.trim(),
          content: content.trim(),
          keywords,
          stage,
          milestoneId: matchingMilestone?.id,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createResearchNote({
          projectId,
          stage,
          milestoneId: matchingMilestone?.id,
          title: title.trim(),
          content: content.trim(),
          keywords,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      // 성공 시 초기화
      setTitle("");
      setContent("");
      setKeywords([]);
      setStage("literature_review");
      onSuccess();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 닫힐 때 초기화
      if (!isEdit) {
        setTitle("");
        setContent("");
        setKeywords([]);
        setStage("literature_review");
      }
      setError(null);
    } else if (isEdit && note) {
      // 열릴 때 기존 값 설정
      setTitle(note.title);
      setContent(note.content);
      setKeywords(note.keywords || []);
      setStage(note.stage || "literature_review");
    }
    onOpenChange(newOpen);
  };

  // 오늘 날짜 표시
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "연구노트 수정" : "새 연구노트 작성"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            작성일: {today}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* 연구 단계 선택 */}
          <div className="space-y-2">
            <Label htmlFor="stage">연구 단계 *</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as MilestoneStage)}>
              <SelectTrigger>
                <SelectValue placeholder="연구 단계 선택" />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {MILESTONE_STAGE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="연구노트 제목 (예: 선행연구 분석 - 도시재생 관련)"
              required
            />
          </div>

          {/* 키워드 */}
          <div className="space-y-2">
            <Label>키워드</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="키워드 입력 후 Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddKeyword}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    #{keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 본문 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">내용 * (마크다운 지원)</Label>
              <div className="flex items-center gap-2">
                {/* 미리보기 모드 토글 */}
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    type="button"
                    variant={previewMode === "edit" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-7 px-2"
                    onClick={() => setPreviewMode("edit")}
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === "split" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-7 px-2 border-x"
                    onClick={() => setPreviewMode("split")}
                  >
                    Split
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-7 px-2"
                    onClick={() => setPreviewMode("preview")}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                {/* MD 파일 업로드 */}
                <input
                  type="file"
                  accept=".md"
                  ref={fileInputRef}
                  onChange={handleMdFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  MD 파일
                </Button>
              </div>
            </div>
            <div className={`grid gap-4 ${previewMode === "split" ? "grid-cols-2" : "grid-cols-1"}`}>
              {(previewMode === "edit" || previewMode === "split") && (
                <div className="space-y-1">
                  {previewMode === "split" && (
                    <p className="text-xs text-muted-foreground">마크다운 편집</p>
                  )}
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`오늘 수행한 연구 활동을 기록하세요.

예시:
## 문헌조사 진행사항
- 검색한 데이터베이스: Google Scholar, RISS
- 검색 키워드: "도시재생", "주민참여"

### 수집 논문
1. 논문 제목 A (저자, 2024)
2. 논문 제목 B (저자, 2023)

### 주요 발견사항
> 인용문 또는 중요 내용...`}
                    className={`font-mono text-sm ${previewMode === "split" ? "min-h-[300px]" : "min-h-[250px]"}`}
                    required
                  />
                </div>
              )}
              {(previewMode === "preview" || previewMode === "split") && (
                <div className="space-y-1">
                  {previewMode === "split" && (
                    <p className="text-xs text-muted-foreground">미리보기</p>
                  )}
                  <div className={`border rounded-md p-4 overflow-auto bg-muted/30 ${previewMode === "split" ? "min-h-[300px]" : "min-h-[250px]"}`}>
                    {content ? (
                      <div className="flowchart-content prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        마크다운을 입력하면 미리보기가 표시됩니다.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || !stage || saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "저장" : "작성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
