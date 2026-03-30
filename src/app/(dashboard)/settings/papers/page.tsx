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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Pencil,
  Save,
  UserCheck,
  UserX,
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

interface SearchQueryEntry {
  api: string;
  query: string;
  fields_of_study?: string[];
  concepts?: string[];
}

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

  const updateQueries = useMutation({
    mutationFn: async ({
      id,
      searchQueries,
    }: {
      id: string;
      searchQueries: SearchQueryEntry[];
    }) => {
      const { error } = await supabase
        .from("research_fields")
        .update({ search_queries: searchQueries })
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
              <TableHead>검색 쿼리</TableHead>
              <TableHead>마지막 검색</TableHead>
              <TableHead>활성</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(fields ?? []).map((field) => {
              const queries: SearchQueryEntry[] = Array.isArray(field.search_queries)
                ? field.search_queries
                : [];

              return (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {field.name_en}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{field.map_node_id}</Badge>
                  </TableCell>
                  <TableCell>
                    <SearchQueryEditor
                      fieldId={field.id}
                      fieldName={field.name}
                      queries={queries}
                      onSave={(newQueries) =>
                        updateQueries.mutate({
                          id: field.id,
                          searchQueries: newQueries,
                        })
                      }
                      isSaving={updateQueries.isPending}
                    />
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Search Query Editor Dialog ───
function SearchQueryEditor({
  fieldId,
  fieldName,
  queries,
  onSave,
  isSaving,
}: {
  fieldId: string;
  fieldName: string;
  queries: SearchQueryEntry[];
  onSave: (queries: SearchQueryEntry[]) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SearchQueryEntry[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(
        queries.length > 0
          ? queries.map((q) => ({ ...q }))
          : [{ api: "semantic_scholar", query: "" }]
      );
    }
    setOpen(isOpen);
  };

  const updateDraftQuery = (index: number, value: string) => {
    setDraft((prev) =>
      prev.map((q, i) => (i === index ? { ...q, query: value } : q))
    );
  };

  const updateDraftApi = (index: number, api: string) => {
    setDraft((prev) =>
      prev.map((q, i) => (i === index ? { ...q, api } : q))
    );
  };

  const addQuery = () => {
    setDraft((prev) => [...prev, { api: "semantic_scholar", query: "" }]);
  };

  const removeQuery = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const valid = draft.filter((q) => q.query.trim() !== "");
    onSave(valid);
    setOpen(false);
  };

  const queryCount = queries.length;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          {queryCount > 0 ? `${queryCount}개 쿼리` : "설정"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>검색 쿼리 편집 — {fieldName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {draft.map((q, i) => (
            <div key={`${fieldId}-query-${i}`} className="flex items-start gap-2">
              <Select value={q.api} onValueChange={(v) => updateDraftApi(i, v)}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic_scholar">Semantic Scholar</SelectItem>
                  <SelectItem value="openalex">OpenAlex</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={q.query}
                onChange={(e) => updateDraftQuery(i, e.target.value)}
                placeholder={`검색 쿼리 (예: "green space" accessibility equity)`}
                className="min-h-[60px] flex-1 text-sm"
              />
              {draft.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive"
                  onClick={() => removeQuery(i)}
                >
                  &times;
                </Button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={addQuery}>
              + 쿼리 추가
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 2: Papers List ───
function PapersListTab() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: researchFields } = useQuery({
    queryKey: ["research-fields-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research_fields")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["papers-list", debouncedSearch, fieldFilter],
    queryFn: async () => {
      if (fieldFilter !== "all") {
        // Field filter: query through paper_field_links join
        const { data: linkData, error: linkError } = await supabase
          .from("paper_field_links")
          .select("paper_id")
          .eq("field_id", fieldFilter);
        if (linkError) throw linkError;

        const paperIds = (linkData ?? []).map((l) => l.paper_id);
        if (paperIds.length === 0) {
          return { papers: [], total: 0 };
        }

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
          .in("id", paperIds)
          .order("publication_date", { ascending: false, nullsFirst: false })
          .limit(50);

        if (debouncedSearch) {
          query = query.ilike("title", `%${debouncedSearch}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { papers: data, total: count ?? 0 };
      }

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

  const toggleLabMember = useMutation({
    mutationFn: async ({
      id,
      isLabMember,
    }: {
      id: string;
      isLabMember: boolean;
    }) => {
      const { error } = await supabase
        .from("papers")
        .update({ is_lab_member: isLabMember })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["papers-list"] });
      queryClient.invalidateQueries({ queryKey: ["papers", "map-nodes"] });
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>논문 목록 ({data?.total ?? 0})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="분야 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 분야</SelectItem>
                {(researchFields ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <TableHead>Lab</TableHead>
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
                        toggleLabMember.mutate({
                          id: paper.id,
                          isLabMember: !paper.is_lab_member,
                        })
                      }
                      disabled={toggleLabMember.isPending}
                      title={paper.is_lab_member ? "Lab 멤버 논문 해제" : "Lab 멤버 논문으로 지정"}
                    >
                      {paper.is_lab_member ? (
                        <UserCheck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
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
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
