"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProject, deleteProject } from "@/lib/actions/research";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Trash2, Target, BookOpen } from "lucide-react";
import Link from "next/link";

const categories = [
  { value: "thesis", label: "학위논문" },
  { value: "submission", label: "학술지 투고" },
  { value: "revision", label: "수정/재투고" },
  { value: "individual", label: "개인 연구" },
  { value: "grant", label: "연구과제" },
];

const projectTypes = [
  { value: "advanced", label: "선진연구" },
  { value: "general", label: "일반연구" },
];

const statuses = [
  { value: "preparing", label: "준비중" },
  { value: "submitting", label: "투고중" },
  { value: "under_review", label: "심사중" },
  { value: "revision", label: "수정중" },
  { value: "accepted", label: "게재확정" },
  { value: "published", label: "출판완료" },
];

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("submission");
  const [projectType, setProjectType] = useState("general");
  const [description, setDescription] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("preparing");

  useEffect(() => {
    async function loadProject() {
      const supabase = createClient();
      const { data: project } = await supabase
        .from("research_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (project) {
        const p = project as {
          title: string;
          category: string;
          project_type: string;
          description: string | null;
          target_journal: string | null;
          deadline: string | null;
          status: string;
        };
        setTitle(p.title);
        setCategory(p.category);
        setProjectType(p.project_type || "general");
        setDescription(p.description || "");
        setTargetJournal(p.target_journal || "");
        setDeadline(p.deadline || "");
        setStatus(p.status);
      }
      setIsLoading(false);
    }

    loadProject();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      setIsSaving(false);
      return;
    }

    const result = await updateProject(id, {
      title,
      category,
      project_type: projectType,
      description: description || undefined,
      target_journal: targetJournal || undefined,
      deadline: deadline || undefined,
      status,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else {
      router.push(`/research/${id}`);
    }
  }

  async function handleDelete() {
    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    const result = await deleteProject(id);
    if (result.error) {
      setError(result.error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/research/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">프로젝트 수정</h1>
            <p className="text-muted-foreground">프로젝트 정보를 수정합니다.</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          삭제
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              프로젝트 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="연구 프로젝트 제목"
                required
                disabled={isSaving}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>카테고리 *</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>연구 유형 *</Label>
                <Select
                  value={projectType}
                  onValueChange={setProjectType}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>상태 *</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">태그/설명</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: #신진연구, #개별연구"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* 저널 및 일정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              저널 및 일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetJournal">타겟 저널</Label>
                <Input
                  id="targetJournal"
                  value={targetJournal}
                  onChange={(e) => setTargetJournal(e.target.value)}
                  placeholder="예: Journal of Urban Planning"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  투고 예정인 저널명을 입력하세요.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">마감일 (D-day)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  투고 또는 제출 목표일을 입력하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">저자 정보 안내</p>
              <p>
                저자 정보는 프로젝트 상세 페이지에서 관리할 수 있습니다.
                프로젝트 상세 페이지의 &quot;저자 정보&quot; 섹션에서 저자를 추가, 수정, 삭제할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </Button>
          <Link href={`/research/${id}`}>
            <Button type="button" variant="outline" disabled={isSaving}>
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
