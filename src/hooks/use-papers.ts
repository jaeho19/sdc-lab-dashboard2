import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import type { PaperMapData, PaperMapNode, PaperMapLink } from "@/lib/papers/types";
import { truncateTitle, buildPaperDetailHtml } from "@/lib/papers/normalize";

function createPapersClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface UsePapersOptions {
  labOnly?: boolean;
  limit?: number;
  enabled?: boolean;
}

interface DBPaper {
  id: string;
  title: string;
  authors: { name: string }[];
  abstract: string | null;
  doi: string | null;
  url: string | null;
  journal: string | null;
  publication_date: string | null;
  publication_year: number | null;
  citation_count: number;
  is_lab_member: boolean;
  member_id: string | null;
  paper_field_links: {
    relevance: number;
    research_fields: {
      id: string;
      name: string;
      map_node_id: string | null;
    } | null;
  }[];
}

function paperToMapNode(paper: DBPaper): PaperMapNode {
  return {
    id: `paper_${paper.id.slice(0, 8)}`,
    label: truncateTitle(paper.title, 25),
    type: "paper",
    size: 10 + Math.min((paper.citation_count ?? 0) * 0.3, 8),
    desc: [paper.journal, paper.publication_year, `cited: ${paper.citation_count ?? 0}`]
      .filter(Boolean)
      .join(" | "),
    body: buildPaperDetailHtml(paper),
    doi: paper.doi,
    url: paper.url,
    publicationDate: paper.publication_date,
    isLabMember: paper.is_lab_member,
    memberId: paper.member_id,
  };
}

function paperToMapLinks(paper: DBPaper): PaperMapLink[] {
  const nodeId = `paper_${paper.id.slice(0, 8)}`;
  const links: PaperMapLink[] = [];

  // Link to research field keyword nodes
  for (const link of paper.paper_field_links) {
    const mapNodeId = link.research_fields?.map_node_id;
    if (mapNodeId) {
      links.push({ source: nodeId, target: mapNodeId, type: "link" });
    }
  }

  // Link to lab member student node (if applicable)
  if (paper.is_lab_member && paper.member_id) {
    links.push({
      source: nodeId,
      target: `s_${paper.member_id.slice(0, 4)}`,
      type: "link",
    });
  }

  return links;
}

export function usePapers(options?: UsePapersOptions): {
  data: PaperMapData | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { labOnly, limit = 100, enabled = true } = options ?? {};

  const query = useQuery<PaperMapData>({
    queryKey: ["papers", "map-nodes", { labOnly, limit }],
    queryFn: async () => {
      const supabase = createPapersClient();

      let q = supabase
        .from("papers")
        .select(`
          id, title, authors, abstract, doi, url, journal,
          publication_date, publication_year, citation_count,
          is_lab_member, member_id,
          paper_field_links(
            relevance,
            research_fields(id, name, map_node_id)
          )
        `)
        .eq("is_hidden", false)
        .order("publication_date", { ascending: false })
        .limit(limit);

      if (labOnly) {
        q = q.eq("is_lab_member", true);
      }

      const { data, error } = await q;
      if (error) throw error;

      const papers = (data ?? []) as unknown as DBPaper[];
      const nodes: PaperMapNode[] = papers.map(paperToMapNode);
      const links: PaperMapLink[] = papers.flatMap(paperToMapLinks);

      return { nodes, links };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
