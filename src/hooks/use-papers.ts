import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { PaperMapData, PaperMapNode, PaperMapLink } from "@/lib/papers/types";

function createPapersClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface UsePapersOptions {
  enabled?: boolean;
}

interface FieldPaper {
  title: string;
  journal: string | null;
  publication_year: number | null;
  citation_count: number;
  doi: string | null;
}

interface FieldSummary {
  fieldId: string;
  fieldName: string;
  mapNodeId: string | null;
  papers: FieldPaper[];
}

function buildSummaryHtml(papers: FieldPaper[]): string {
  const topPapers = [...papers]
    .sort((a, b) => b.citation_count - a.citation_count)
    .slice(0, 5);

  const journalCounts = new Map<string, number>();
  for (const p of papers) {
    if (p.journal) {
      journalCounts.set(p.journal, (journalCounts.get(p.journal) ?? 0) + 1);
    }
  }
  const topJournals = [...journalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const parts: string[] = [];

  parts.push(
    `<p style="margin:0 0 8px;font-size:12px;color:#94a3b8">총 <strong style="color:#e0e8ff">${papers.length}</strong>편 논문</p>`
  );

  if (topJournals.length > 0) {
    parts.push(
      `<p style="margin:0 0 10px;font-size:11px;color:#64748b">주요 저널: ${topJournals.map(escapeHtml).join(", ")}</p>`
    );
  }

  if (topPapers.length > 0) {
    parts.push(`<p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#8898b8">인용 상위 논문</p>`);
    parts.push(`<ol style="margin:0;padding-left:16px">`);
    for (const p of topPapers) {
      const meta = [p.journal, p.publication_year, `cited: ${p.citation_count}`]
        .filter(Boolean)
        .join(" | ");
      const titleHtml = p.doi
        ? `<a href="https://doi.org/${escapeHtml(p.doi)}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none">${escapeHtml(p.title)}</a>`
        : escapeHtml(p.title);
      parts.push(
        `<li style="margin-bottom:6px;font-size:12px;line-height:1.4;color:#cbd5e1">${titleHtml}<br/><span style="font-size:10px;color:#64748b">${escapeHtml(meta)}</span></li>`
      );
    }
    parts.push(`</ol>`);
  }

  return parts.join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summaryToMapNode(summary: FieldSummary): PaperMapNode {
  const count = summary.papers.length;
  const topJournals = getTopJournals(summary.papers, 2);
  const desc = topJournals.length > 0
    ? `${count}편 | ${topJournals.join(", ")}`
    : `${count}편`;

  return {
    id: `papersummary_${summary.fieldId.slice(0, 8)}`,
    label: `${summary.fieldName} (${count})`,
    type: "paper",
    size: Math.min(12 + count * 0.5, 25),
    desc,
    body: buildSummaryHtml(summary.papers),
    doi: null,
    url: null,
    publicationDate: null,
    isLabMember: false,
    memberId: null,
    paperCount: count,
  };
}

function getTopJournals(papers: FieldPaper[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const p of papers) {
    if (p.journal) {
      counts.set(p.journal, (counts.get(p.journal) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name);
}

function summaryToMapLinks(summary: FieldSummary): PaperMapLink[] {
  if (!summary.mapNodeId) return [];
  return [
    {
      source: `papersummary_${summary.fieldId.slice(0, 8)}`,
      target: summary.mapNodeId,
      type: "link",
    },
  ];
}

export function usePapers(options?: UsePapersOptions): {
  data: PaperMapData | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { enabled = true } = options ?? {};

  const query = useQuery<PaperMapData>({
    queryKey: ["papers", "field-summary"],
    queryFn: async () => {
      const supabase = createPapersClient();

      // 1. Get all active research fields
      const { data: fields, error: fieldsError } = await supabase
        .from("research_fields")
        .select("id, name, map_node_id")
        .eq("is_active", true);
      if (fieldsError) throw fieldsError;

      // 2. Get all visible papers with their field links
      const { data: papers, error: papersError } = await supabase
        .from("papers")
        .select(`
          id, title, journal, publication_year, citation_count, doi,
          paper_field_links(field_id)
        `)
        .eq("is_hidden", false)
        .order("citation_count", { ascending: false })
        .limit(500);
      if (papersError) throw papersError;

      // 3. Group papers by field
      const fieldMap = new Map<string, FieldPaper[]>();
      for (const paper of (papers ?? []) as unknown as {
        title: string;
        journal: string | null;
        publication_year: number | null;
        citation_count: number;
        doi: string | null;
        paper_field_links: { field_id: string }[];
      }[]) {
        for (const link of paper.paper_field_links ?? []) {
          const existing = fieldMap.get(link.field_id) ?? [];
          existing.push({
            title: paper.title,
            journal: paper.journal,
            publication_year: paper.publication_year,
            citation_count: paper.citation_count,
            doi: paper.doi,
          });
          fieldMap.set(link.field_id, existing);
        }
      }

      // 4. Build summary nodes per field
      const summaries: FieldSummary[] = (fields ?? [])
        .filter((f) => (fieldMap.get(f.id)?.length ?? 0) > 0)
        .map((f) => ({
          fieldId: f.id,
          fieldName: f.name,
          mapNodeId: f.map_node_id,
          papers: fieldMap.get(f.id) ?? [],
        }));

      const nodes: PaperMapNode[] = summaries.map(summaryToMapNode);
      const mapLinks: PaperMapLink[] = summaries.flatMap(summaryToMapLinks);

      return { nodes, links: mapLinks };
    },
    staleTime: 10 * 60 * 1000,
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
