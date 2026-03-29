// =============================================
// OpenAlex API Client
// https://docs.openalex.org/
// =============================================

import type { NormalizedPaper, PaperAuthor } from "./types";

const BASE_URL = "https://api.openalex.org";

interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  display_name?: string;
  publication_date?: string;
  publication_year?: number;
  cited_by_count?: number;
  primary_location?: {
    source?: { display_name?: string; type?: string };
  };
  authorships?: {
    author?: { id?: string; display_name?: string };
    institutions?: { display_name?: string; country_code?: string }[];
  }[];
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: { id?: string; display_name?: string; score?: number }[];
  topics?: { id?: string; display_name?: string; score?: number }[];
  is_oa?: boolean;
  open_access?: { oa_url?: string };
}

interface SearchResponse {
  meta: { count: number; page: number; per_page: number };
  results: OpenAlexWork[];
}

interface SearchOptions {
  query: string;
  fromDate?: string;
  limit?: number;
  mailto?: string;
}

export async function searchOpenAlex(
  options: SearchOptions
): Promise<NormalizedPaper[]> {
  const { query, fromDate, limit = 20, mailto } = options;

  const params = new URLSearchParams({
    search: query,
    sort: "publication_date:desc",
    per_page: String(limit),
    select:
      "id,doi,title,display_name,publication_date,publication_year,cited_by_count,primary_location,authorships,abstract_inverted_index,concepts,topics,is_oa,open_access",
  });

  if (fromDate) {
    params.set("filter", `from_publication_date:${fromDate},type:article`);
  } else {
    params.set("filter", "type:article");
  }

  if (mailto) {
    params.set("mailto", mailto);
  }

  const response = await fetch(`${BASE_URL}/works?${params}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAlex API error ${response.status}: ${text}`);
  }

  const data: SearchResponse = await response.json();

  return (data.results ?? []).map(normalizeOpenAlexWork);
}

function normalizeOpenAlexWork(work: OpenAlexWork): NormalizedPaper {
  const authors: PaperAuthor[] = (work.authorships ?? []).map((a) => ({
    name: a.author?.display_name ?? "Unknown",
    authorId: a.author?.id ?? undefined,
    affiliations: a.institutions?.map((i) => i.display_name ?? "") ?? [],
  }));

  const doi = work.doi ? work.doi.replace("https://doi.org/", "") : null;

  const abstract = work.abstract_inverted_index
    ? restoreAbstractFromInvertedIndex(work.abstract_inverted_index)
    : null;

  return {
    title: work.title ?? work.display_name ?? "Untitled",
    authors,
    abstract,
    doi,
    url: work.doi ?? null,
    journal: work.primary_location?.source?.display_name ?? null,
    publication_date: work.publication_date ?? null,
    publication_year: work.publication_year ?? null,
    citation_count: work.cited_by_count ?? 0,
    source: "openalex",
    external_id: work.id,
    is_open_access: work.is_oa ?? false,
    open_access_url: work.open_access?.oa_url ?? null,
    raw_data: work as unknown as Record<string, unknown>,
  };
}

/**
 * OpenAlex stores abstracts as inverted indexes: { "word": [pos1, pos2], ... }
 * This restores the original text.
 */
function restoreAbstractFromInvertedIndex(
  inverted: Record<string, number[]>
): string {
  const words: [number, string][] = [];

  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }

  words.sort((a, b) => a[0] - b[0]);

  return words.map(([, word]) => word).join(" ");
}
