"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  calculateDday,
  getProjectTypeLabel,
  getAuthorRoleLabel,
  formatDate,
  getSubmissionStatusLabel,
  getSubmissionStatusColor,
  SUBMISSION_STATUS_CONFIG,
} from "@/lib/utils";
import {
  toggleChecklistItem,
  addProjectAuthor,
  deleteProjectAuthor,
  updateProject,
  updateSubmissionStatus,
} from "@/lib/actions/research";
import type { SubmissionStatus } from "@/types/database.types";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  BookOpen,
  CalendarDays,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { WeeklyGoals } from "@/components/features/research/weekly-goals";
import { ProjectTimeline } from "@/components/features/research/project-timeline";
import { ResearchFlowchart } from "@/components/features/research/research-flowchart";
import type { MilestoneStage } from "@/types/database.types";

interface Project {
  id: string;
  title: string;
  category: string;
  project_type: string | null;
  description: string | null;
  target_journal: string | null;
  target_date: string | null;
  status: string;
  overall_progress: number;
  flowchart_md: string | null;
  submission_status: SubmissionStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  content: string;
  is_completed: boolean;
  order_index: number;
}

interface Milestone {
  id: string;
  title: string;
  stage: string;
  weight: number;
  order_index: number;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  checklist_items: ChecklistItem[];
}

interface WeeklyGoal {
  id: string;
  content: string;
  deadline: string;
  linked_stage: MilestoneStage | null;
  is_completed: boolean;
}

interface Author {
  id: string;
  name: string;
  role: string;
  responsibilities: string | null;
  sort_order: number;
}

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 편집 상태
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editJournal, setEditJournal] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // 저자 추가 다이얼로그
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newAuthorRole, setNewAuthorRole] = useState("co_author");
  const [newAuthorResponsibilities, setNewAuthorResponsibilities] = useState("");


  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // 프로젝트 정보
    const { data: projectData } = await supabase
      .from("research_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (!projectData) {
      router.push("/research");
      return;
    }

    const p = projectData as Project;
    setProject(p);
    setEditTitle(p.title);
    setEditType(p.project_type || "general");
    setEditJournal(p.target_journal || "");
    setEditDeadline(p.target_date || "");

    // 마일스톤 및 체크리스트
    const { data: milestonesData, error: milestonesError } = await supabase
      .from("milestones")
      .select(`*, checklist_items (*)`)
      .eq("project_id", id)
      .order("order_index", { ascending: true });

    if (milestonesError) {
      console.error("Milestones fetch error:", milestonesError);
    }
    console.log("Milestones data:", milestonesData);
    setMilestones((milestonesData || []) as Milestone[]);

    // 저자 정보
    const { data: authorsData } = await supabase
      .from("project_authors")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true });

    setAuthors((authorsData || []) as Author[]);

    // 주간 목표
    const { data: goalsData } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("project_id", id)
      .order("deadline", { ascending: true });

    setWeeklyGoals((goalsData || []) as WeeklyGoal[]);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 헤더 저장
  const handleSaveHeader = async () => {
    if (!project) return;
    setSaving(true);

    await updateProject(id, {
      title: editTitle,
      project_type: editType,
      target_journal: editJournal || undefined,
      deadline: editDeadline || undefined,
    });

    setIsEditingHeader(false);
    await fetchData();
    setSaving(false);
  };

  // 체크리스트 토글
  const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    await toggleChecklistItem(itemId, isCompleted, id);
    await fetchData();
  };

  // 저자 추가
  const handleAddAuthor = async () => {
    if (!newAuthorName.trim()) return;
    setSaving(true);

    await addProjectAuthor(id, newAuthorName, newAuthorRole, newAuthorResponsibilities);

    setNewAuthorName("");
    setNewAuthorRole("co_author");
    setNewAuthorResponsibilities("");
    setIsAddAuthorOpen(false);
    await fetchData();
    setSaving(false);
  };

  // 저자 삭제
  const handleDeleteAuthor = async (authorId: string) => {
    if (!confirm("정말로 이 저자를 삭제하시겠습니까?")) return;

    await deleteProjectAuthor(authorId, id);
    await fetchData();
  };

  // 마일스톤 진행률 계산
  const getMilestoneProgress = (checklist: ChecklistItem[]): number => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter((item) => item.is_completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  // 마일스톤 상태 확인
  const getMilestoneStatus = (
    milestone: Milestone,
    allMilestones: Milestone[]
  ): "completed" | "current" | "pending" => {
    const progress = getMilestoneProgress(milestone.checklist_items);
    if (progress === 100) return "completed";

    // 현재 진행 중인 첫 번째 마일스톤 찾기 (완료되지 않은 첫 번째)
    const sortedMilestones = [...allMilestones].sort((a, b) => a.order_index - b.order_index);
    const currentMilestone = sortedMilestones.find(m => getMilestoneProgress(m.checklist_items) < 100);
    if (currentMilestone?.id === milestone.id) return "current";

    return "pending";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const dday = project.target_date ? calculateDday(project.target_date) : null;

  // 상태 뱃지 색상
  const getStatusBadge = () => {
    const progress = project.overall_progress;

    if (progress === 0) {
      return <Badge className="bg-gray-500">Preparing</Badge>;
    }

    if (dday?.isOverdue) {
      return <Badge className="bg-red-500">Delayed</Badge>;
    }

    if (progress >= 80 || (dday && dday.dday > 30)) {
      return <Badge className="bg-green-500">On Track</Badge>;
    }

    return <Badge className="bg-blue-500">In Progress</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/research">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Research Project</p>
          {!isEditingHeader ? (
            <h1 className="text-2xl lg:text-3xl font-bold">{project.title}</h1>
          ) : (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-2xl font-bold h-auto py-1"
            />
          )}
        </div>
        {!isEditingHeader ? (
          <Button variant="outline" onClick={() => setIsEditingHeader(true)}>
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveHeader} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              저장
            </Button>
            <Button variant="ghost" onClick={() => setIsEditingHeader(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Project Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* TYPE */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">TYPE</p>
              {!isEditingHeader ? (
                <Badge variant="outline" className="text-sm">
                  {getProjectTypeLabel(project.project_type || "general")}
                </Badge>
              ) : (
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advanced">선진연구</SelectItem>
                    <SelectItem value="general">일반연구</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 타겟 저널 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">타겟 저널</p>
              {!isEditingHeader ? (
                <p className="font-medium truncate">{project.target_journal || "-"}</p>
              ) : (
                <Input
                  value={editJournal}
                  onChange={(e) => setEditJournal(e.target.value)}
                  placeholder="저널명"
                  className="h-8"
                />
              )}
            </div>

            {/* 마감일 & D-day */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">마감일</p>
              {!isEditingHeader ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {project.target_date ? formatDate(project.target_date) : "-"}
                  </span>
                  {dday && (
                    <Badge
                      className={
                        dday.isOverdue
                          ? "bg-red-500"
                          : dday.dday <= 7
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }
                    >
                      {dday.label}
                    </Badge>
                  )}
                </div>
              ) : (
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="h-8"
                />
              )}
            </div>

            {/* 상태 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">상태</p>
              {getStatusBadge()}
            </div>

            {/* 전체 진행률 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">전체 진행률</p>
              <div className="flex items-center gap-2">
                <Progress value={project.overall_progress} className="h-2 flex-1" />
                <span className="text-lg font-bold text-primary min-w-[3rem] text-right">
                  {project.overall_progress}%
                </span>
              </div>
            </div>
          </div>

          {/* 투고 상태 섹션 (진행률 100% 또는 투고 후에만 표시) */}
          {(project.overall_progress === 100 || project.submission_status !== "not_submitted") && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">투고 상태</p>
                  <Badge className={getSubmissionStatusColor(project.submission_status)}>
                    {getSubmissionStatusLabel(project.submission_status)}
                  </Badge>
                  {project.submitted_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      투고일: {formatDate(project.submitted_at)}
                    </p>
                  )}
                </div>
                {project.submission_status !== "not_submitted" && (
                  <Select
                    value={project.submission_status}
                    onValueChange={async (value) => {
                      await updateSubmissionStatus(id, value);
                      fetchData();
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="상태 변경" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUBMISSION_STATUS_CONFIG)
                        .filter(([key]) => key !== "not_submitted")
                        .map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 주간 목표 섹션 */}
      <WeeklyGoals
        projectId={id}
        goals={weeklyGoals}
        onRefresh={fetchData}
      />

      {/* 6단계 진행 카드 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          단계별 진행 현황
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {milestones
            .sort((a, b) => a.order_index - b.order_index)
            .map((milestone, index) => {
              const progress = getMilestoneProgress(milestone.checklist_items);
              const status = getMilestoneStatus(milestone, milestones);
              const isCompleted = status === "completed";
              const isCurrent = status === "current";

              return (
                <Card
                  key={milestone.id}
                  className={`transition-all ${
                    isCompleted
                      ? "border-green-500 border-2"
                      : isCurrent
                      ? "border-primary border-2 shadow-lg"
                      : "border-muted"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{milestone.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            가중치: {milestone.weight}%
                          </p>
                        </div>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-orange-500 text-xs">CURRENT</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 진행률 바 */}
                    <div className="flex items-center gap-2">
                      <Progress
                        value={progress}
                        className={`h-2 flex-1 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
                      />
                      <span className="text-sm font-medium w-10 text-right">{progress}%</span>
                    </div>

                    {/* 체크리스트 */}
                    <div className="space-y-2">
                      {milestone.checklist_items
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Checkbox
                              checked={item.is_completed}
                              onCheckedChange={(checked) =>
                                handleToggleChecklistItem(item.id, checked === true)
                              }
                              className="mt-0.5"
                            />
                            <span
                              className={
                                item.is_completed
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              {item.content}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* 프로젝트 타임라인 */}
      <ProjectTimeline
        projectId={id}
        milestones={milestones.map((m) => ({
          id: m.id,
          title: m.title,
          stage: m.stage,
          weight: m.weight,
          order_index: m.order_index,
          progress: getMilestoneProgress(m.checklist_items),
          start_date: m.start_date,
          end_date: m.end_date,
        }))}
        projectDeadline={project.target_date}
        onRefresh={fetchData}
      />

      {/* 연구 흐름도 */}
      <ResearchFlowchart
        projectId={id}
        flowchartMd={project.flowchart_md}
        onRefresh={fetchData}
      />

      {/* 저자 정보 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              저자 정보
            </CardTitle>
            <Dialog open={isAddAuthorOpen} onOpenChange={setIsAddAuthorOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  저자 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>저자 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input
                      value={newAuthorName}
                      onChange={(e) => setNewAuthorName(e.target.value)}
                      placeholder="저자 이름"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>역할</Label>
                    <Select value={newAuthorRole} onValueChange={setNewAuthorRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_author">1저자</SelectItem>
                        <SelectItem value="corresponding">교신저자</SelectItem>
                        <SelectItem value="co_author">공저자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>담당업무</Label>
                    <Input
                      value={newAuthorResponsibilities}
                      onChange={(e) => setNewAuthorResponsibilities(e.target.value)}
                      placeholder="예: 데이터 분석, 논문 작성"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddAuthor} disabled={!newAuthorName.trim() || saving}>
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      추가
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddAuthorOpen(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {authors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>담당업무</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell className="font-medium">{author.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          author.role === "first_author"
                            ? "border-blue-500 text-blue-600"
                            : author.role === "corresponding"
                            ? "border-purple-500 text-purple-600"
                            : ""
                        }
                      >
                        {getAuthorRoleLabel(author.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {author.responsibilities || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteAuthor(author.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 저자가 없습니다.</p>
              <p className="text-sm">저자 추가 버튼을 클릭하여 저자를 등록하세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
