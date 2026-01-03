"use client";

import { useState } from "react";
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
import { X, Loader2, Plus } from "lucide-react";
import { createResearchNote, updateResearchNote } from "@/lib/actions/research-notes";
import { MILESTONE_STAGE_LABEL } from "@/lib/constants";
import type { MilestoneStage } from "@/types/database.types";

interface Milestone {
  id: string;
  stage: MilestoneStage;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  milestone_id: string;
}

interface ResearchNoteFormProps {
  projectId: string;
  milestones: Milestone[];
  note?: ResearchNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ResearchNoteForm({
  projectId,
  milestones,
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
  const [milestoneId, setMilestoneId] = useState(note?.milestone_id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!title.trim() || !content.trim() || !milestoneId) return;

    setSaving(true);
    setError(null);

    try {
      if (isEdit && note) {
        const result = await updateResearchNote(note.id, {
          title: title.trim(),
          content: content.trim(),
          keywords,
          milestoneId,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createResearchNote({
          projectId,
          milestoneId,
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
      setMilestoneId("");
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
        setMilestoneId("");
      }
      setError(null);
    } else if (isEdit && note) {
      // 열릴 때 기존 값 설정
      setTitle(note.title);
      setContent(note.content);
      setKeywords(note.keywords || []);
      setMilestoneId(note.milestone_id);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "연구노트 수정" : "새 연구노트 작성"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* 마일스톤 선택 */}
          <div className="space-y-2">
            <Label htmlFor="milestone">연결 마일스톤 *</Label>
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger>
                <SelectValue placeholder="마일스톤 단계 선택" />
              </SelectTrigger>
              <SelectContent>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {MILESTONE_STAGE_LABEL[m.stage] || m.stage}
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
              placeholder="연구노트 제목"
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
            <Label htmlFor="content">내용 * (마크다운 지원)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="연구 과정, 사용한 데이터베이스, 검색 전략 등을 기록하세요..."
              rows={12}
              required
            />
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
              disabled={!title.trim() || !content.trim() || !milestoneId || saving}
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
