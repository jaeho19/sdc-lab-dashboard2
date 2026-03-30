import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchSemanticScholar } from "@/lib/papers/semantic-scholar";
import { searchOpenAlex } from "@/lib/papers/openalex";
import { deduplicatePapers } from "@/lib/papers/normalize";
import { matchLabMember } from "@/lib/papers/member-matcher";
import type {
  NormalizedPaper,
  SearchQuery,
  ResearchField,
  FetchPapersResult,
} from "@/lib/papers/types";
import type { LabMember } from "@/lib/papers/member-matcher";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Netlify free plan: max 26s function timeout */
export const maxDuration = 25;

/** Rate limit delay between API calls */
const API_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get date string N days ago (YYYY-MM-DD) */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

async function fetchPapers(): Promise<FetchPapersResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  // 1. Create log entry
  const { data: logEntry, error: logError } = await supabase
    .from("paper_fetch_logs")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (logError || !logEntry) {
    throw new Error(`Failed to create log entry: ${logError?.message}`);
  }

  const logId = logEntry.id;

  try {
    // 2. Load active research fields
    const { data: fields, error: fieldsError } = await supabase
      .from("research_fields")
      .select("*")
      .eq("is_active", true);

    if (fieldsError) {
      throw new Error(`Failed to load research fields: ${fieldsError.message}`);
    }

    if (!fields || fields.length === 0) {
      await updateLog(supabase, logId, "completed", { fields_searched: 0 });
      return {
        logId,
        fieldsSearched: 0,
        papersFound: 0,
        papersInserted: 0,
        papersSkipped: 0,
        errors: [],
      };
    }

    // 3. Load lab members for matching
    const { data: membersRaw } = await supabase
      .from("members")
      .select("id, name, name_en")
      .in("status", ["active", "graduated"]);

    const labMembers: LabMember[] = (membersRaw ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      name_en: m.name_en,
    }));

    // 4. Load existing DOIs for dedup
    const { data: existingPapers } = await supabase
      .from("papers")
      .select("doi")
      .not("doi", "is", null);

    const existingDois = new Set(
      (existingPapers ?? []).map((p) => p.doi?.toLowerCase())
    );

    // 5. Search papers for each field
    const fromDate = getDateDaysAgo(1825); // 5 years
    const startTime = Date.now();
    const MAX_RUNTIME_MS = 22_000; // Stop before 25s timeout
    let totalFound = 0;
    let totalInserted = 0;
    let totalSkipped = 0;

    // Shuffle fields so different fields get processed each run (avoids timeout bias)
    const shuffledFields = [...(fields as ResearchField[])].sort(() => Math.random() - 0.5);

    for (const field of shuffledFields) {
      // Safety: stop before serverless timeout
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        errors.push(`Timeout: processed ${totalFound} papers, remaining fields skipped`);
        break;
      }
      const queries: SearchQuery[] = Array.isArray(field.search_queries)
        ? field.search_queries
        : [];

      let fieldPapers: NormalizedPaper[] = [];

      // Search Semantic Scholar
      const s2Query = queries.find((q) => q.api === "semantic_scholar");
      if (s2Query) {
        try {
          const s2Papers = await searchSemanticScholar({
            query: s2Query.query,
            fromDate,
            fieldsOfStudy: s2Query.fields_of_study,
            limit: 20,
            apiKey: process.env.SEMANTIC_SCHOLAR_API_KEY,
          });
          fieldPapers.push(...s2Papers);
        } catch (err) {
          const msg = `S2 error for "${field.name_en}": ${err instanceof Error ? err.message : String(err)}`;
          errors.push(msg);
        }
        await sleep(API_DELAY_MS);
      }

      // Search OpenAlex
      const oaQuery = queries.find((q) => q.api === "openalex");
      if (oaQuery) {
        try {
          const oaPapers = await searchOpenAlex({
            query: oaQuery.query,
            fromDate,
            limit: 20,
            mailto: process.env.OPENALEX_MAILTO,
          });
          fieldPapers.push(...oaPapers);
        } catch (err) {
          const msg = `OA error for "${field.name_en}": ${err instanceof Error ? err.message : String(err)}`;
          errors.push(msg);
        }
        await sleep(API_DELAY_MS);
      }

      // Deduplicate within field results
      fieldPapers = deduplicatePapers(fieldPapers);
      totalFound += fieldPapers.length;

      // Insert papers
      for (const paper of fieldPapers) {
        // Skip if DOI already exists in DB
        if (paper.doi && existingDois.has(paper.doi.toLowerCase())) {
          totalSkipped++;

          // Still create field link if missing
          const { data: existingPaper } = await supabase
            .from("papers")
            .select("id")
            .eq("doi", paper.doi)
            .single();

          if (existingPaper) {
            await supabase.from("paper_field_links").upsert(
              {
                paper_id: existingPaper.id,
                field_id: field.id,
                relevance: 0.5,
              },
              { onConflict: "paper_id,field_id" }
            );
          }
          continue;
        }

        // Match lab member
        const memberMatch = matchLabMember(paper.authors, labMembers);

        // Insert paper
        const { data: insertedPaper, error: insertError } = await supabase
          .from("papers")
          .upsert(
            {
              title: paper.title,
              authors: paper.authors as unknown as Record<string, unknown>[],
              abstract: paper.abstract,
              doi: paper.doi,
              url: paper.url ?? paper.open_access_url,
              journal: paper.journal,
              publication_date: paper.publication_date,
              publication_year: paper.publication_year,
              citation_count: paper.citation_count,
              source: paper.source,
              external_id: paper.external_id,
              is_lab_member: memberMatch.matched,
              member_id: memberMatch.memberId,
              raw_data: paper.raw_data as unknown as Record<string, unknown>,
            },
            { onConflict: "doi", ignoreDuplicates: false }
          )
          .select("id")
          .single();

        if (insertError) {
          // If DOI conflict (paper without DOI but title clash), skip
          if (insertError.code === "23505") {
            totalSkipped++;
            continue;
          }
          errors.push(
            `Insert error: ${insertError.message} (${paper.title.slice(0, 50)})`
          );
          continue;
        }

        if (insertedPaper) {
          totalInserted++;
          existingDois.add(paper.doi?.toLowerCase() ?? "");

          // Create field link
          await supabase.from("paper_field_links").upsert(
            {
              paper_id: insertedPaper.id,
              field_id: field.id,
              relevance: 0.5,
            },
            { onConflict: "paper_id,field_id" }
          );
        }
      }

      // Update last_fetched_at
      await supabase
        .from("research_fields")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", field.id);
    }

    // 6. Update log
    await updateLog(supabase, logId, "completed", {
      fields_searched: fields.length,
      papers_found: totalFound,
      papers_inserted: totalInserted,
      papers_skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
    });

    return {
      logId,
      fieldsSearched: fields.length,
      papersFound: totalFound,
      papersInserted: totalInserted,
      papersSkipped: totalSkipped,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await updateLog(supabase, logId, "failed", {
      errors: [errorMsg, ...errors],
    });
    throw err;
  }
}

async function updateLog(
  supabase: ReturnType<typeof createServiceClient>,
  logId: string,
  status: string,
  data: Record<string, unknown>
) {
  await supabase
    .from("paper_fetch_logs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      ...data,
    })
    .eq("id", logId);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await fetchPapers();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
