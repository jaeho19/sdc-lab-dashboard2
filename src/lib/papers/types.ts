// =============================================
// Paper Auto-Update — Common Types
// =============================================

/** Normalized paper from any API source */
export interface NormalizedPaper {
  title: string;
  authors: PaperAuthor[];
  abstract: string | null;
  doi: string | null;
  url: string | null;
  journal: string | null;
  publication_date: string | null;
  publication_year: number | null;
  citation_count: number;
  source: PaperSource;
  external_id: string;
  is_open_access: boolean;
  open_access_url: string | null;
  raw_data: Record<string, unknown>;
}

export interface PaperAuthor {
  name: string;
  authorId?: string;
  affiliations?: string[];
}

export type PaperSource = "semantic_scholar" | "openalex";

/** Search query stored in research_fields.search_queries JSONB */
export interface SearchQuery {
  api: PaperSource;
  query: string;
  fields_of_study?: string[];
  concepts?: string[];
}

/** Research field row from DB */
export interface ResearchField {
  id: string;
  name: string;
  name_en: string;
  search_queries: SearchQuery[];
  map_node_id: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
}

/** Result of a single field search */
export interface FieldSearchResult {
  field: ResearchField;
  papers: NormalizedPaper[];
  errors: string[];
}

/** Overall fetch result */
export interface FetchPapersResult {
  logId: string;
  fieldsSearched: number;
  papersFound: number;
  papersInserted: number;
  papersSkipped: number;
  errors: string[];
}

/** Paper node for Research Map */
export interface PaperMapNode {
  id: string;
  label: string;
  type: "paper";
  size: number;
  desc: string;
  body: string;
  doi: string | null;
  url: string | null;
  publicationDate: string | null;
  isLabMember: boolean;
  memberId: string | null;
  paperCount?: number;
}

export interface PaperMapLink {
  source: string;
  target: string;
  type: "link";
}

export interface PaperMapData {
  nodes: PaperMapNode[];
  links: PaperMapLink[];
}
