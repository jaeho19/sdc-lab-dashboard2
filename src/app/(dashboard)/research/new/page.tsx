"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createProject } from "@/lib/actions/research";
import { ArrowLeft, Loader2, Target, BookOpen, CalendarDays } from "lucide-react";
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

export default function NewResearchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("submission");
  const [projectType, setProjectType] = useState("general");
  const [description, setDescription] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("preparing");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const result = await createProject({
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
      setIsLoading(false);
    } else if (result.id) {
      router.push(`/research/${result.id}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/research">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 연구 프로젝트</h1>
          <p className="text-muted-foreground">
            새로운 연구 프로젝트를 생성하고 6단계 진행 관리를 시작합니다.
          </p>
        </div>
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
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>카테고리 *</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">6단계 진행 관리</p>
                <p>
                  프로젝트를 생성하면 다음 6단계의 마일스톤과 체크리스트가 자동으로 생성됩니다:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>문헌조사 (15%) - 키워드 검색, 핵심 논문 선정, 연구 차별성 확보</li>
                  <li>방법론 설계 (15%) - 가설 설정, 변수 정의, 분석 모형 선정</li>
                  <li>데이터 수집 (15%) - 데이터 확보, 전처리, 정제</li>
                  <li>분석 (25%) - 기초 통계, 시각화, 가설 검증, 결과 해석</li>
                  <li>초고 작성 (20%) - 서론, 연구방법, 결과, 결론 작성</li>
                  <li>투고 (10%) - 포맷팅, Cover Letter, 제출</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            프로젝트 생성
          </Button>
          <Link href="/research">
            <Button type="button" variant="outline" disabled={isLoading}>
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
