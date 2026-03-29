import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const fieldId = searchParams.get("field_id");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);
  const sort = searchParams.get("sort") ?? "date";
  const labOnly = searchParams.get("lab_only") === "true";
  const search = searchParams.get("search");

  let query = supabase
    .from("papers")
    .select(
      `
      id, title, authors, abstract, doi, url, journal,
      publication_date, publication_year, citation_count,
      source, is_lab_member, member_id, is_hidden, created_at,
      paper_field_links(
        relevance,
        field_id,
        research_fields(id, name, name_en, map_node_id)
      )
    `,
      { count: "exact" }
    );

  if (labOnly) {
    query = query.eq("is_lab_member", true);
  }

  if (fieldId) {
    query = query.filter("paper_field_links.field_id", "eq", fieldId);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (sort === "citations") {
    query = query.order("citation_count", { ascending: false });
  } else {
    query = query.order("publication_date", { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Paper ID required" }, { status: 400 });
  }

  const allowedFields = ["is_hidden", "is_lab_member", "member_id"];
  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      filtered[key] = updates[key];
    }
  }

  // RLS enforces professor-only writes at runtime
  const { error } = await (supabase
    .from("papers") as ReturnType<typeof supabase.from>)
    .update(filtered as never)
    .eq("id" as never, id as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
