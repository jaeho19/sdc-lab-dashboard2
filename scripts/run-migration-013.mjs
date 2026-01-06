import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE environment variables");
  console.error("Run with: node --env-file=.env.local scripts/run-migration-013.mjs");
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL Error: ${text}`);
  }

  return response.json();
}

async function runMigration() {
  const migrationPath = join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "00013_fix_research_notes_schema.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  console.log("Running migration: 00013_fix_research_notes_schema.sql\n");

  // Try to run the entire migration
  try {
    await runSQL(sql);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.log("Note: exec_sql function not available.");
    console.log("Please run the migration manually in Supabase Dashboard SQL Editor.\n");
    console.log("SQL to run:");
    console.log("---");
    console.log(sql);
    console.log("---");
  }
}

runMigration().catch(console.error);
