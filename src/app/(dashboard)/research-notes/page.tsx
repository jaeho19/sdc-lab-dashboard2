"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Calendar,
  Filter,
  FileText,
  ExternalLink,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { createResearchNote, updateResearchNote, deleteResearchNote } from "@/lib/actions/research-notes";
import { getInitials } from "@/lib/utils";
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

interface Author {
  id: string;
  name: string;
  avatar_url: string | null;
  position: string;
}

interface Project {
  id: string;
  title: string;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  stage: MilestoneStage;
  keywords: string[];
  created_at: string;
  updated_at: string;
  project: Project;
  author: Author;
}

interface CurrentUser {
  id: string;
  name: string;
  position: string;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export default function ResearchNotesPage() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 필터 상태 - 날짜 기본값을 오늘로 설정
  const [authorFilter, setAuthorFilter] = useState<string>("me"); // "me" = 본인, "all" = 전체, 또는 특정 member_id
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(getTodayDate());
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  // 노트 작성 모달 상태
  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStage, setFormStage] = useState<MilestoneStage>("literature_review");
  const [formProjectId, setFormProjectId] = useState("");
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 미리보기 모드
  const [previewMode, setPreviewMode] = useState(false);

  // 수정/삭제 상태
  const [editingNote, setEditingNote] = useState<ResearchNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // 현재 사용자 정보 조회
    const { data: { user } } = await supabase.auth.getUser();
    let userIsAdmin = false;

    if (user) {
      const { data: memberData } = await supabase
        .from("members")
        .select("id, name, position")
        .eq("id", user.id)
        .single();

      if (memberData) {
        const member = memberData as CurrentUser;
        setCurrentUser(member);
        userIsAdmin = member.position === "professor";
        setIsAdmin(userIsAdmin);
      }

      // 교수인 경우 모든 활성 멤버 목록 조회
      if (userIsAdmin) {
        const { data: membersData } = await supabase
          .from("members")
          .select("id, name")
          .eq("status", "active")
          .order("name");

        if (membersData) {
          setMembers(membersData as { id: string; name: string }[]);
        }
      }
    }

    // 사용자의 프로젝트 목록 조회
    if (user) {
      const { data: projectsData } = await supabase
        .from("project_members")
        .select(`
          project:research_projects (
            id,
            title
          )
        `)
        .eq("member_id", user.id);

      if (projectsData) {
        const uniqueProjects = projectsData
          .filter((p: any) => p.project)
          .map((p: any) => p.project) as Project[];
        setProjects(uniqueProjects);
        if (uniqueProjects.length > 0 && !formProjectId) {
          setFormProjectId(uniqueProjects[0].id);
        }
      }
    }

    // 연구노트 조회
    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("research_notes")
      .select(`
        id,
        title,
        content,
        stage,
        keywords,
        created_at,
        updated_at,
        project:research_projects!research_notes_project_id_fkey (
          id,
          title
        ),
        author:members!research_notes_author_id_fkey (
          id,
          name,
          avatar_url,
          position
        )
      `)
      .order("created_at", { ascending: false });

    // 작성자 필터 적용 (교수는 전체 또는 특정 연구원 선택 가능)
    if (userIsAdmin) {
      if (authorFilter === "me") {
        query = query.eq("author_id", user.id);
      } else if (authorFilter !== "all") {
        query = query.eq("author_id", authorFilter);
      }
      // "all"인 경우 필터 없음 - 모든 노트 표시
    } else {
      // 일반 연구원은 본인 노트만
      query = query.eq("author_id", user.id);
    }

    // 필터 적용
    if (stageFilter !== "all") {
      query = query.eq("stage", stageFilter);
    }
    if (dateFilter) {
      const startOfDay = `${dateFilter}T00:00:00`;
      const endOfDay = `${dateFilter}T23:59:59`;
      query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
      setLoading(false);
      return;
    }

    setNotes((data || []) as ResearchNote[]);
    setLoading(false);
  }, [authorFilter, stageFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 키워드 추가
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().replace(/^#/, "");
    if (trimmed && !formKeywords.includes(trimmed)) {
      setFormKeywords([...formKeywords, trimmed]);
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
    setFormKeywords(formKeywords.filter((k) => k !== keyword));
  };

  // MD 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      alert("MD 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormContent(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 노트 저장 (생성 또는 수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !formProjectId || !formStage) return;

    setSaving(true);
    setFormError(null);

    if (editingNote) {
      // 수정
      const result = await updateResearchNote(editingNote.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        keywords: formKeywords,
        stage: formStage,
      });

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }
    } else {
      // 생성
      const result = await createResearchNote({
        projectId: formProjectId,
        stage: formStage,
        title: formTitle.trim(),
        content: formContent.trim(),
        keywords: formKeywords,
      });

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }
    }

    // 성공 시 초기화
    resetForm();
    setFormOpen(false);
    setSaving(false);
    fetchData();
  };

  // 폼 초기화
  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormStage("literature_review");
    setFormKeywords([]);
    setFormError(null);
    setPreviewMode(false);
    setEditingNote(null);
  };

  // 수정 시작
  const handleEdit = (note: ResearchNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormStage(note.stage);
    setFormKeywords(note.keywords);
    setFormProjectId(note.project.id);
    setFormOpen(true);
  };

  // 삭제
  const handleDelete = async (noteId: string) => {
    if (!confirm("정말로 이 연구노트를 삭제하시겠습니까?")) return;

    setDeletingNoteId(noteId);
    const result = await deleteResearchNote(noteId);

    if (result.error) {
      alert(result.error);
    }

    setDeletingNoteId(null);
    fetchData();
  };

  // 권한 확인 (수정/삭제 가능 여부)
  const canEditNote = (note: ResearchNote) => {
    if (!currentUser) return false;
    return isAdmin || note.author.id === currentUser.id;
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

  const sortedDates = Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a));

  // 통계
  const totalNotes = notes.length;
  const stageStats = notes.reduce((acc, note) => {
    acc[note.stage] = (acc[note.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 오늘 날짜 표시
  const todayDisplay = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            {isAdmin ? "연구노트 관리" : "내 연구노트"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? `연구원들의 연구 활동 기록 | ${todayDisplay}`
              : `${currentUser?.name}님의 연구 활동 기록 | ${todayDisplay}`
            }
          </p>
        </div>
        <Button onClick={() => { resetForm(); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          새 노트 작성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNotes}</p>
                <p className="text-sm text-muted-foreground">전체 노트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stageStats["literature_review"] || 0}</p>
                <p className="text-sm text-muted-foreground">문헌조사</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stageStats["analysis"] || 0}</p>
                <p className="text-sm text-muted-foreground">분석</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stageStats["draft_writing"] || 0}</p>
                <p className="text-sm text-muted-foreground">초고 작성</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* 연구원 필터 - 교수만 표시 */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="연구원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 연구원</SelectItem>
                    <SelectItem value="me">내 노트</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 단계 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="전체 단계" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 단계</SelectItem>
                  {MILESTONE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {MILESTONE_STAGE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 필터 - 기본값 오늘 */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[160px]"
              />
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter("")}
                >
                  전체 보기
                </Button>
              )}
              {!dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateFilter(getTodayDate())}
                >
                  오늘
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 노트 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">
              {dateFilter
                ? `${new Date(dateFilter).toLocaleDateString("ko-KR")}에 작성된 연구노트가 없습니다.`
                : "등록된 연구노트가 없습니다."}
            </p>
            <Button onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              첫 연구노트 작성하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">
                  {new Date(date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {groupedNotes[date].length}건
                </Badge>
              </div>

              {/* 해당 날짜의 노트들 */}
              <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
                {groupedNotes[date].map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* 작성자 아바타 */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={note.author.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(note.author.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          {/* 헤더 */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{note.title}</h4>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                {/* 교수가 전체 보기일 때 작성자 이름 표시 */}
                                {isAdmin && authorFilter !== "me" && (
                                  <>
                                    <span className="font-medium text-foreground">{note.author.name}</span>
                                    <span>·</span>
                                  </>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {MILESTONE_STAGE_LABEL[note.stage]}
                                </Badge>
                                <span>·</span>
                                <span>
                                  {new Date(note.created_at).toLocaleTimeString("ko-KR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Link href={`/research/${note.project.id}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  프로젝트
                                </Button>
                              </Link>
                              {canEditNote(note) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(note)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(note.id)}
                                      className="text-red-600 focus:text-red-600"
                                      disabled={deletingNoteId === note.id}
                                    >
                                      {deletingNoteId === note.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                      )}
                                      삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>

                          {/* 본문 미리보기 */}
                          <div className="mt-3 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {note.content.length > 500
                                ? note.content.slice(0, 500) + "..."
                                : note.content}
                            </ReactMarkdown>
                          </div>

                          {/* 프로젝트 & 키워드 */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {note.project.title}
                            </Badge>
                            {note.keywords.slice(0, 3).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                #{keyword}
                              </Badge>
                            ))}
                            {note.keywords.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{note.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 노트 작성 모달 */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingNote ? "연구노트 수정" : "새 연구노트 작성"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingNote
                ? `작성일: ${new Date(editingNote.created_at).toLocaleDateString("ko-KR")}`
                : `작성일: ${todayDisplay}`
              }
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* 프로젝트 선택 - 수정 시 변경 불가 */}
              <div className="space-y-2">
                <Label>연구 프로젝트 *</Label>
                <Select
                  value={formProjectId}
                  onValueChange={setFormProjectId}
                  disabled={!!editingNote}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="프로젝트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingNote && (
                  <p className="text-xs text-muted-foreground">프로젝트는 수정할 수 없습니다</p>
                )}
              </div>

              {/* 연구 단계 선택 */}
              <div className="space-y-2">
                <Label>연구 단계 *</Label>
                <Select value={formStage} onValueChange={(v) => setFormStage(v as MilestoneStage)}>
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
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
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
                <Button type="button" variant="outline" onClick={handleAddKeyword}>
                  추가
                </Button>
              </div>
              {formKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
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

            {/* MD 파일 업로드 */}
            <div className="space-y-2">
              <Label>MD 파일 업로드 (선택)</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  MD 파일 선택
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  또는 아래 텍스트 영역에 직접 마크다운을 입력하세요
                </span>
              </div>
            </div>

            {/* 본문 - 편집/미리보기 토글 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">내용 * (마크다운 지원)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "편집" : "미리보기"}
                </Button>
              </div>

              {previewMode ? (
                <div className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none dark:prose-invert bg-muted/30">
                  {formContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formContent}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">내용을 입력하세요...</p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={`오늘 수행한 연구 활동을 마크다운 형식으로 기록하세요.

## 예시
- **검색한 데이터베이스**: Google Scholar, RISS
- **검색 키워드**: "도시재생", "주민참여"
- **수집한 논문 수**: 15편

### 주요 발견사항
1. 첫 번째 발견사항
2. 두 번째 발견사항`}
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={!formTitle.trim() || !formContent.trim() || !formProjectId || saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                저장
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
