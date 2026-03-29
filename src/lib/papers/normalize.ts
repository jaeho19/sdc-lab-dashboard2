// =============================================
// Paper Deduplication & Normalization Utilities
// =============================================

import type { NormalizedPaper } from "./types";

/**
 * Deduplicate papers across multiple API sources.
 * Priority: DOI match > title+year match
 */
export function deduplicatePapers(
  papers: NormalizedPaper[]
): NormalizedPaper[] {
  const seen = new Map<string, NormalizedPaper>();

  for (const paper of papers) {
    const doiKey = paper.doi ? normalizeDoi(paper.doi) : null;
    const titleKey = normalizeTitleKey(paper.title, paper.publication_year);

    // DOI-based dedup (prefer Semantic Scholar for richer metadata)
    if (doiKey && seen.has(`doi:${doiKey}`)) {
      const existing = seen.get(`doi:${doiKey}`)!;
      if (paper.source === "semantic_scholar" && existing.source === "openalex") {
        seen.set(`doi:${doiKey}`, paper);
        if (titleKey) seen.set(`title:${titleKey}`, paper);
      }
      continue;
    }

    // Title+year fallback dedup
    if (titleKey && seen.has(`title:${titleKey}`)) {
      continue;
    }

    if (doiKey) seen.set(`doi:${doiKey}`, paper);
    if (titleKey) seen.set(`title:${titleKey}`, paper);
  }

  // Collect unique papers
  const uniqueKeys = new Set<string>();
  const result: NormalizedPaper[] = [];

  seen.forEach((paper) => {
    const paperId = paper.doi ?? paper.external_id;
    if (!uniqueKeys.has(paperId)) {
      uniqueKeys.add(paperId);
      result.push(paper);
    }
  });

  return result;
}

/** Normalize DOI for comparison */
function normalizeDoi(doi: string): string {
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/doi\.org\//, "")
    .trim();
}

/** Create a normalized key from title + year for fuzzy dedup */
function normalizeTitleKey(
  title: string,
  year: number | null
): string | null {
  if (!title) return null;

  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return year ? `${normalized}:${year}` : normalized;
}

/** Truncate title for display in Research Map nodes */
export function truncateTitle(title: string, maxLength = 25): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + "...";
}

/** Build HTML body for paper detail panel */
export function buildPaperDetailHtml(paper: {
  title: string;
  authors: { name: string }[];
  abstract?: string | null;
  journal?: string | null;
  publication_year?: number | null;
  citation_count?: number;
  doi?: string | null;
  url?: string | null;
}): string {
  const authorStr = paper.authors
    .slice(0, 5)
    .map((a) => a.name)
    .join(", ");
  const authorSuffix = paper.authors.length > 5 ? " et al." : "";

  const parts: string[] = [
    `<h3 style="margin:0 0 8px;font-size:14px;line-height:1.4">${escapeHtml(paper.title)}</h3>`,
    `<p style="margin:0 0 4px;font-size:12px;color:#94a3b8">${escapeHtml(authorStr + authorSuffix)}</p>`,
  ];

  const meta: string[] = [];
  if (paper.journal) meta.push(escapeHtml(paper.journal));
  if (paper.publication_year) meta.push(String(paper.publication_year));
  if (paper.citation_count !== undefined)
    meta.push(`Cited: ${paper.citation_count}`);

  if (meta.length > 0) {
    parts.push(
      `<p style="margin:0 0 8px;font-size:11px;color:#64748b">${meta.join(" | ")}</p>`
    );
  }

  if (paper.abstract) {
    const shortAbstract =
      paper.abstract.length > 300
        ? paper.abstract.slice(0, 297) + "..."
        : paper.abstract;
    parts.push(
      `<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#cbd5e1">${escapeHtml(shortAbstract)}</p>`
    );
  }

  if (paper.doi) {
    parts.push(
      `<a href="https://doi.org/${escapeHtml(paper.doi)}" target="_blank" rel="noopener" style="font-size:12px;color:#60a5fa">DOI: ${escapeHtml(paper.doi)}</a>`
    );
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
