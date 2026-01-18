"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Calendar, Loader2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
import { MILESTONE_STAGE_LABEL } from "@/lib/constants";
import type { MilestoneStage } from "@/types/database.types";
import Link from "next/link";
import dynamic from "next/dynamic";

// 경량 마크다운 렌더러를 동적 임포트 (KaTeX 미포함)
const MarkdownSimple = dynamic(
  () => import("@/components/ui/markdown-simple").then((mod) => mod.MarkdownSimple),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

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

interface Project {
  id: string;
  title: string;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  stage: MilestoneStage;
  created_at: string;
  project: {
    id: string;
    title: string;
  } | null;
}

interface MemberResearchNotesProps {
  memberId: string;
  memberName: string;
  canEdit: boolean;
}

export function MemberResearchNotes({
  memberId,
  memberName,
  canEdit,
}: MemberResearchNotesProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [stage, setStage] = useState<MilestoneStage>("literature_review");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();

    // 해당 멤버가 작성한 연구노트 조회
    const { data, error } = await supabase
      .from("research_notes")
      .select(`
        id,
        title,
        content,
        stage,
        created_at,
        project:research_projects (
          id,
          title
        )
      `)
      .eq("author_id", memberId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setNotes((data || []) as ResearchNote[]);
    }
    setLoading(false);
  }, [memberId]);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();

    // 해당 멤버가 참여하는 프로젝트 목록 조회
    const { data } = await supabase
      .from("project_members")
      .select(`
        research_projects (
          id,
          title
        )
      `)
      .eq("member_id", memberId);

    if (data) {
      const projectList = data
        .map((pm: { research_projects: Project | null }) => pm.research_projects)
        .filter((p): p is Project => p !== null);
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectList[0].id);
      }
    }
  }, [memberId, selectedProjectId]);

  useEffect(() => {
    fetchNotes();
    fetchProjects();
  }, [fetchNotes, fetchProjects]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedProjectId) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("research_notes").insert({
      title: title.trim(),
      content: content.trim(),
      stage,
      project_id: selectedProjectId,
      author_id: memberId,
      keywords: [],
    } as never);

    if (error) {
      console.error("Error creating note:", error);
    } else {
      setTitle("");
      setContent("");
      setStage("literature_review");
      setFormOpen(false);
      fetchNotes();
    }
    setSaving(false);
  };

  const toggleNoteExpand = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  // 날짜별 그룹화
  const groupedNotes = notes.reduce((groups, note) => {
    const date = note.created_at.split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(note);
    return groups;
  }, {} as Record<string, ResearchNote[]>);

  const sortedDates = Object.keys(groupedNotes).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          연구노트
          <Badge variant="secondary" className="ml-1">
            {notes.length}
          </Badge>
        </CardTitle>
        {canEdit && projects.length > 0 && (
          <Button onClick={() => setFormOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            새 노트 작성
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            로딩 중...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>등록된 연구노트가 없습니다.</p>
            {canEdit && projects.length > 0 && (
              <p className="text-sm mt-2">
                새 노트 작성 버튼을 클릭하여 연구 기록을 시작하세요.
              </p>
            )}
            {canEdit && projects.length === 0 && (
              <p className="text-sm mt-2">
                참여 중인 프로젝트가 없습니다. 먼저 프로젝트에 참여해주세요.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* 해당 날짜의 노트들 */}
                <div className="space-y-3 ml-6">
                  {groupedNotes[date].map((note) => {
                    const isExpanded = expandedNotes.has(note.id);
                    const contentPreview = note.content.length > 200
                      ? note.content.slice(0, 200) + "..."
                      : note.content;

                    return (
                      <div
                        key={note.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{note.title}</h4>
                            {note.project && (
                              <Link
                                href={`/research/${note.project.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {note.project.title}
                              </Link>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {MILESTONE_STAGE_LABEL[note.stage]}
                          </Badge>
                        </div>

                        {/* 내용 미리보기/전체 */}
                        <div className="text-sm text-muted-foreground">
                          {isExpanded ? (
                            <MarkdownSimple content={note.content} />
                          ) : (
                            <p className="whitespace-pre-wrap">{contentPreview}</p>
                          )}
                        </div>

                        {note.content.length > 200 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleNoteExpand(note.id)}
                            className="mt-2 h-7 px-2 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                접기
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                더 보기
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 새 노트 작성 다이얼로그 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 연구노트 작성</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 프로젝트 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">프로젝트</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 연구 단계 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">연구 단계</label>
              <Select value={stage} onValueChange={(v) => setStage(v as MilestoneStage)}>
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="연구노트 제목"
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">내용 (마크다운 지원)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="연구 내용을 기록하세요..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !title.trim() || !content.trim() || !selectedProjectId}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
