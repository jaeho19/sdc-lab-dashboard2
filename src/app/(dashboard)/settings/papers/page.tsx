"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient as createOriginalClient } from "@supabase/supabase-js";

/** Untyped client for admin operations on new tables */
function createClient() {
  return createOriginalClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
import { useCurrentMember } from "@/hooks/use-current-member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function PapersSettingsPage() {
  const { isAdmin } = useCurrentMember();

  if (!isAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">논문 관리 (Paper Management)</h1>
        <p className="text-sm text-muted-foreground">
          연구분야별 자동 검색 키워드 관리 및 논문 목록 조회
        </p>
      </div>

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">연구분야 키워드</TabsTrigger>
          <TabsTrigger value="papers">논문 목록</TabsTrigger>
          <TabsTrigger value="logs">실행 로그</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-4">
          <ResearchFieldsTab />
        </TabsContent>
        <TabsContent value="papers" className="mt-4">
          <PapersListTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <FetchLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Tab 1: Research Fields ───
function ResearchFieldsTab() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: fields, isLoading } = useQuery({
    queryKey: ["research-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_fields")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("research_fields")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["research-fields"] }),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          연구분야 키워드 ({fields?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>분야명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead>Map 노드</TableHead>
              <TableHead>마지막 검색</TableHead>
              <TableHead>활성</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(fields ?? []).map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {field.name_en}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{field.map_node_id}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {field.last_fetched_at
                    ? new Date(field.last_fetched_at).toLocaleDateString("ko-KR")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant={field.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      toggleActive.mutate({
                        id: field.id,
                        isActive: !field.is_active,
                      })
                    }
                    disabled={toggleActive.isPending}
                  >
                    {field.is_active ? "활성" : "비활성"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Tab 2: Papers List ───
function PapersListTab() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["papers-list", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("papers")
        .select(
          `
          id, title, authors, doi, journal,
          publication_date, publication_year, citation_count,
          source, is_lab_member, is_hidden, created_at,
          paper_field_links(research_fields(name))
        `,
          { count: "exact" }
        )
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(50);

      if (debouncedSearch) {
        query = query.ilike("title", `%${debouncedSearch}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { papers: data, total: count ?? 0 };
    },
  });

  const toggleHidden = useMutation({
    mutationFn: async ({
      id,
      isHidden,
    }: {
      id: string;
      isHidden: boolean;
    }) => {
      const { error } = await supabase
        .from("papers")
        .update({ is_hidden: isHidden })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["papers-list"] }),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>논문 목록 ({data?.total ?? 0})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="논문 제목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">제목</TableHead>
              <TableHead>저널</TableHead>
              <TableHead>연도</TableHead>
              <TableHead>인용</TableHead>
              <TableHead>출처</TableHead>
              <TableHead>분야</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.papers ?? []).map((paper) => {
              const fields = (paper.paper_field_links ?? [])
                .map((l: Record<string, unknown>) => {
                  const rf = l.research_fields as { name: string } | { name: string }[] | null;
                  if (Array.isArray(rf)) return rf[0]?.name;
                  return rf?.name;
                })
                .filter(Boolean);

              return (
                <TableRow
                  key={paper.id}
                  className={paper.is_hidden ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {paper.title}
                        </p>
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            DOI
                          </a>
                        )}
                      </div>
                      {paper.is_lab_member && (
                        <Badge variant="default" className="shrink-0 text-[10px]">
                          Lab
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {paper.journal ?? "—"}
                  </TableCell>
                  <TableCell>{paper.publication_year ?? "—"}</TableCell>
                  <TableCell>{paper.citation_count}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {paper.source === "semantic_scholar" ? "S2" : "OA"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(fields as string[]).slice(0, 2).map((f, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleHidden.mutate({
                          id: paper.id,
                          isHidden: !paper.is_hidden,
                        })
                      }
                      disabled={toggleHidden.isPending}
                    >
                      {paper.is_hidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(data?.papers ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  논문이 없습니다. 수동 검색을 실행하세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Tab 3: Fetch Logs ───
function FetchLogsTab() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isFetching, setIsFetching] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["paper-fetch-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_fetch_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const handleManualFetch = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/papers/fetch", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        console.error("Fetch failed:", data.error);
      }
      queryClient.invalidateQueries({ queryKey: ["paper-fetch-logs"] });
      queryClient.invalidateQueries({ queryKey: ["papers-list"] });
      queryClient.invalidateQueries({ queryKey: ["papers", "map-nodes"] });
    } catch (err) {
      console.error("Manual fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }, [queryClient]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            실행 로그
          </CardTitle>
          <Button onClick={handleManualFetch} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            수동 검색 실행
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>실행 시각</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>분야 수</TableHead>
              <TableHead>발견</TableHead>
              <TableHead>추가</TableHead>
              <TableHead>건너뜀</TableHead>
              <TableHead>오류</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs ?? []).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {new Date(log.started_at).toLocaleString("ko-KR")}
                </TableCell>
                <TableCell>
                  <LogStatusBadge status={log.status} />
                </TableCell>
                <TableCell>{log.fields_searched}</TableCell>
                <TableCell>{log.papers_found}</TableCell>
                <TableCell className="font-medium text-green-600">
                  +{log.papers_inserted}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.papers_skipped}
                </TableCell>
                <TableCell>
                  {Array.isArray(log.errors) && log.errors.length > 0 ? (
                    <Badge variant="destructive" className="text-[10px]">
                      {log.errors.length}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(logs ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  실행 로그가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── UI Helpers ───
function LogStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        완료
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        실패
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      실행 중
    </Badge>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
