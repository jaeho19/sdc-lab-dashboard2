"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Bot, Plus, History, ChevronRight, Calendar } from "lucide-react";
import dynamic from "next/dynamic";

// 경량 마크다운 렌더러를 동적 임포트 (KaTeX 미포함)
const MarkdownSimple = dynamic(
  () => import("@/components/ui/markdown-simple").then((mod) => mod.MarkdownSimple),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface PeerReview {
  id: string;
  title: string;
  content: string;
  review_result: string | null;
  review_status: string;
  created_at: string;
  project?: {
    id: string;
    title: string;
  } | null;
}

interface Project {
  id: string;
  title: string;
}

export default function PeerReviewPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    fetchReviews();
    fetchProjects();
  }, []);

  async function fetchReviews() {
    try {
      const response = await fetch("/api/peer-review");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  }

  async function fetchProjects() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("research_projects")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          projectId: selectedProject || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTitle("");
        setContent("");
        setSelectedProject("");
        await fetchReviews();

        // Show the result
        const newReview = {
          id: result.id,
          title,
          content,
          review_result: result.reviewResult,
          review_status: "completed",
          created_at: new Date().toISOString(),
        };
        setSelectedReview(newReview);
        setActiveTab("history");
      } else {
        const error = await response.json();
        alert(error.error || "리뷰 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("리뷰 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">완료</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">처리 중</Badge>;
      case "error":
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="secondary">대기</Badge>;
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 md:h-7 md:w-7 text-purple-500" />
          AI Peer Review
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Claude AI를 활용한 연구 동료 심사 서비스
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xs md:max-w-md grid-cols-2">
          <TabsTrigger value="new" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            새 리뷰 요청
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <History className="h-3.5 w-3.5 md:h-4 md:w-4" />
            리뷰 기록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4 md:mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  연구 내용 입력
                </CardTitle>
                <CardDescription>
                  리뷰를 받고 싶은 연구 내용을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">제목</label>
                    <Input
                      placeholder="연구 제목을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">연구 프로젝트 (선택)</label>
                    <Select
                      value={selectedProject}
                      onValueChange={(val) => setSelectedProject(val === "none" ? "" : val)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안함</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">연구 내용</label>
                    <Textarea
                      placeholder="연구 내용, 초록, 또는 리뷰받고 싶은 부분을 입력하세요...&#10;&#10;예시:&#10;- 연구 배경 및 목적&#10;- 연구 방법론&#10;- 주요 결과&#10;- 논의 및 결론"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSubmitting}
                      className="min-h-[300px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AI 리뷰 생성 중...
                      </>
                    ) : (
                      <>
                        <Bot className="mr-2 h-4 w-4" />
                        AI 리뷰 요청
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>AI Peer Review 안내</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">리뷰 구성</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 종합 평가 (권고사항 포함)</li>
                    <li>• 주요 코멘트 [M1, M2, ...] - 필수 수정</li>
                    <li>• 부수적 코멘트 [m1, m2, ...] - 선택 수정</li>
                    <li>• 저자에게 묻는 질문</li>
                    <li>• 수정 우선순위 요약 (테이블)</li>
                    <li>• 최종 의견 및 격려</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">방법론 평가</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 재현가능성 및 엄밀성</li>
                    <li>• 통계 방법의 적절성</li>
                    <li>• 대조군 및 검증 절차</li>
                    <li>• 윤리적 고려사항</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">통계적 엄밀성 확인</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 효과 크기 및 신뢰구간</li>
                    <li>• 다중 검정 보정</li>
                    <li>• 검정력 분석</li>
                    <li>• 결측 데이터 처리</li>
                  </ul>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
                  <strong>심사 원칙:</strong> 건설적, 구체적, 균형있는 피드백을 제공하며, 저자의 노력을 존중합니다.
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  <strong>참고:</strong> AI 리뷰는 참고용이며, 실제 동료 심사를 대체하지 않습니다.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 이번 달 사용 이력 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {format(new Date(), "yyyy년 M월", { locale: ko })} 사용 이력
                <Badge variant="secondary" className="ml-2">
                  {reviews.length}회
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                매월 1일에 이전 달 기록이 자동으로 삭제됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  이번 달 사용 이력이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {reviews.slice(0, 5).map((review) => (
                    <button
                      key={review.id}
                      onClick={() => {
                        setSelectedReview(review);
                        setActiveTab("history");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{review.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "M월 d일 HH:mm", {
                            locale: ko,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(review.review_status)}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                  {reviews.length > 5 && (
                    <button
                      onClick={() => setActiveTab("history")}
                      className="w-full text-center text-sm text-primary hover:underline py-2"
                    >
                      +{reviews.length - 5}개 더 보기
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Review List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">리뷰 기록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {reviews.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    아직 리뷰 기록이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y">
                    {reviews.map((review) => (
                      <button
                        key={review.id}
                        onClick={() => setSelectedReview(review)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedReview?.id === review.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{review.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(review.created_at), "yyyy.MM.dd HH:mm", {
                                locale: ko,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(review.review_status)}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Detail */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedReview ? selectedReview.title : "리뷰 선택"}
                </CardTitle>
                {selectedReview && (
                  <CardDescription>
                    {format(new Date(selectedReview.created_at), "yyyy년 MM월 dd일 HH:mm", {
                      locale: ko,
                    })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedReview ? (
                  <div className="space-y-6">
                    {/* Original Content */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                        제출된 내용
                      </h4>
                      <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedReview.content}
                      </div>
                    </div>

                    {/* Review Result */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                        AI 리뷰 결과
                      </h4>
                      {selectedReview.review_result ? (
                        <div className="p-4 bg-purple-50/50 rounded-lg overflow-auto max-h-[600px] border border-purple-100">
                          <MarkdownSimple content={selectedReview.review_result} />
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {selectedReview.review_status === "processing" ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              리뷰 생성 중...
                            </div>
                          ) : (
                            "리뷰 결과가 없습니다."
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    왼쪽에서 리뷰를 선택하세요
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
