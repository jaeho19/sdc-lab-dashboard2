"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus, Filter } from "lucide-react";
import { ResearchNoteCard } from "./research-note-card";
import { ResearchNoteForm } from "./research-note-form";
import { createClient } from "@/lib/supabase/client";
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

interface Author {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: Author;
}

interface FileItem {
  id: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  stage: MilestoneStage;
  created_at: string;
  milestone_id: string | null;
  author: Author;
  comments: Comment[];
  files: FileItem[];
}

interface ResearchNotesSectionProps {
  projectId: string;
  milestones: Milestone[];
  canEdit: boolean;
}

export function ResearchNotesSection({
  projectId,
  milestones,
  canEdit,
}: ResearchNotesSectionProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ResearchNote | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();

    // 현재 사용자 정보
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: memberData } = await supabase
        .from("members")
        .select("position")
        .eq("id", user.id)
        .single();
      const member = memberData as { position: string } | null;
      setIsAdmin(member?.position === "professor");
    }

    // 노트 조회
    const { data, error } = await supabase
      .from("research_notes")
      .select(`
        id,
        title,
        content,
        keywords,
        stage,
        created_at,
        milestone_id,
        author:members!research_notes_author_id_fkey (
          id,
          name,
          avatar_url
        ),
        comments:research_note_comments (
          id,
          content,
          created_at,
          author:members!research_note_comments_author_id_fkey (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      setLoading(false);
      return;
    }

    // 파일 조회
    const notesData = (data || []) as Array<{ id: string; [key: string]: unknown }>;
    const noteIds = notesData.map(n => n.id);
    let filesMap: Record<string, FileItem[]> = {};

    if (noteIds.length > 0) {
      const { data: filesData } = await supabase
        .from("files")
        .select("id, original_filename, file_path, file_size, mime_type, entity_id")
        .eq("entity_type", "research_note")
        .in("entity_id", noteIds);

      type FileQueryResult = {
        id: string;
        original_filename: string;
        file_path: string;
        file_size: number | null;
        mime_type: string | null;
        entity_id: string;
      };
      const files = (filesData || []) as FileQueryResult[];
      files.forEach(file => {
        if (!filesMap[file.entity_id]) {
          filesMap[file.entity_id] = [];
        }
        filesMap[file.entity_id].push({
          id: file.id,
          original_filename: file.original_filename,
          file_path: file.file_path,
          file_size: file.file_size,
          mime_type: file.mime_type,
        });
      });
    }

    // 데이터 변환
    const transformedNotes: ResearchNote[] = (data || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      keywords: note.keywords || [],
      stage: note.stage,
      created_at: note.created_at,
      milestone_id: note.milestone_id,
      author: note.author,
      comments: (note.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        author: c.author,
      })),
      files: filesMap[note.id] || [],
    }));

    setNotes(transformedNotes);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleEditNote = (note: ResearchNote) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchNotes();
    setEditingNote(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  // 필터링된 노트
  const filteredNotes =
    stageFilter === "all"
      ? notes
      : notes.filter((n) => n.stage === stageFilter);

  // 단계별 노트 개수
  const noteCounts = notes.reduce((acc, note) => {
    const stage = note.stage;
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            연구노트
            <Badge variant="secondary" className="ml-1">
              {notes.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* 필터 */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 단계</SelectItem>
                {MILESTONE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {MILESTONE_STAGE_LABEL[s]}
                    {noteCounts[s] ? ` (${noteCounts[s]})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 새 노트 버튼 */}
            {canEdit && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                새 노트 작성
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            로딩 중...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {stageFilter === "all"
              ? "등록된 연구노트가 없습니다."
              : `${MILESTONE_STAGE_LABEL[stageFilter as MilestoneStage]} 단계의 연구노트가 없습니다.`}
            <p className="text-sm mt-2">새 노트 작성 버튼을 클릭하여 연구 기록을 시작하세요.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <ResearchNoteCard
              key={note.id}
              note={note}
              projectId={projectId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canEdit={canEdit}
              onEdit={() => handleEditNote(note)}
              onRefresh={fetchNotes}
            />
          ))
        )}
      </CardContent>

      {/* 작성/수정 폼 */}
      <ResearchNoteForm
        projectId={projectId}
        milestones={milestones}
        note={editingNote ? {
          id: editingNote.id,
          title: editingNote.title,
          content: editingNote.content,
          keywords: editingNote.keywords,
          stage: editingNote.stage,
          milestone_id: editingNote.milestone_id || undefined,
        } : null}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </Card>
  );
}
