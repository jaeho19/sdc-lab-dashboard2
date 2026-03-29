// =============================================
// Semantic Scholar API Client
// https://api.semanticscholar.org/api-docs/graph
// =============================================

import type { NormalizedPaper, PaperAuthor } from "./types";

const BASE_URL = "https://api.semanticscholar.org/graph/v1";

const FIELDS = [
  "paperId",
  "externalIds",
  "title",
  "abstract",
  "url",
  "venue",
  "year",
  "citationCount",
  "publicationDate",
  "journal",
  "authors",
  "fieldsOfStudy",
  "isOpenAccess",
  "openAccessPdf",
].join(",");

interface SemanticScholarPaper {
  paperId: string;
  externalIds?: { DOI?: string; MAG?: string; CorpusId?: number };
  title: string;
  abstract?: string;
  url?: string;
  venue?: string;
  year?: number;
  citationCount?: number;
  publicationDate?: string;
  journal?: { name?: string; volume?: string; pages?: string };
  authors?: { authorId?: string; name?: string }[];
  fieldsOfStudy?: string[];
  isOpenAccess?: boolean;
  openAccessPdf?: { url?: string };
}

interface SearchResponse {
  total: number;
  offset: number;
  data: SemanticScholarPaper[];
}

interface SearchOptions {
  query: string;
  fromDate?: string;
  fieldsOfStudy?: string[];
  limit?: number;
  apiKey?: string;
}

export async function searchSemanticScholar(
  options: SearchOptions
): Promise<NormalizedPaper[]> {
  const { query, fromDate, fieldsOfStudy, limit = 20, apiKey } = options;

  const params = new URLSearchParams({
    query,
    fields: FIELDS,
    limit: String(limit),
  });

  if (fromDate) {
    params.set("publicationDateOrYear", `${fromDate}:`);
  }

  if (fieldsOfStudy?.length) {
    params.set("fieldsOfStudy", fieldsOfStudy.join(","));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(`${BASE_URL}/paper/search?${params}`, {
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Semantic Scholar API error ${response.status}: ${text}`
    );
  }

  const data: SearchResponse = await response.json();

  return (data.data ?? []).map(normalizeSemanticScholarPaper);
}

function normalizeSemanticScholarPaper(
  paper: SemanticScholarPaper
): NormalizedPaper {
  const authors: PaperAuthor[] = (paper.authors ?? []).map((a) => ({
    name: a.name ?? "Unknown",
    authorId: a.authorId ?? undefined,
  }));

  return {
    title: paper.title,
    authors,
    abstract: paper.abstract ?? null,
    doi: paper.externalIds?.DOI ?? null,
    url: paper.url ?? null,
    journal: paper.journal?.name ?? paper.venue ?? null,
    publication_date: paper.publicationDate ?? null,
    publication_year: paper.year ?? null,
    citation_count: paper.citationCount ?? 0,
    source: "semantic_scholar",
    external_id: paper.paperId,
    is_open_access: paper.isOpenAccess ?? false,
    open_access_url: paper.openAccessPdf?.url ?? null,
    raw_data: paper as unknown as Record<string, unknown>,
  };
}
