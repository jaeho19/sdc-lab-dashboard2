"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Calendar,
  Filter,
  User,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
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

interface Member {
  id: string;
  name: string;
}

export default function ResearchNotesPage() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // 멤버 목록 조회
    const { data: membersData } = await supabase
      .from("members")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    setMembers((membersData || []) as Member[]);

    // 연구노트 조회
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

    // 필터 적용
    if (authorFilter !== "all") {
      query = query.eq("author_id", authorFilter);
    }
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          연구노트
        </h1>
        <p className="text-muted-foreground mt-1">
          연구원들의 연구 활동 기록을 확인할 수 있습니다.
        </p>
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
            {/* 연구원 필터 */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Select value={authorFilter} onValueChange={setAuthorFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="전체 연구원" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 연구원</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* 날짜 필터 */}
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
                  초기화
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
            <p>등록된 연구노트가 없습니다.</p>
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
                                <span>{note.author.name}</span>
                                <span>·</span>
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
                            <Link href={`/research/${note.project.id}`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                프로젝트
                              </Button>
                            </Link>
                          </div>

                          {/* 본문 미리보기 */}
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {note.content.replace(/[#*`]/g, "").slice(0, 200)}
                            {note.content.length > 200 && "..."}
                          </p>

                          {/* 프로젝트 & 키워드 */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
    </div>
  );
}
