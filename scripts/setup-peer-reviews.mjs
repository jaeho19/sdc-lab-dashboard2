// This script creates the peer_reviews table using Supabase Management API
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

const SQL = `
-- Create peer_reviews table
CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  review_result TEXT,
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (ignore if exist)
CREATE INDEX IF NOT EXISTS idx_peer_reviews_member_id ON peer_reviews(member_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_created_at ON peer_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own peer reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Admins can view all peer reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Users can insert own peer reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Users can update own peer reviews" ON peer_reviews;
DROP POLICY IF EXISTS "Users can delete own peer reviews" ON peer_reviews;

-- Create RLS Policies
CREATE POLICY "Users can view own peer reviews" ON peer_reviews
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Admins can view all peer reviews" ON peer_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
  );

CREATE POLICY "Users can insert own peer reviews" ON peer_reviews
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update own peer reviews" ON peer_reviews
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete own peer reviews" ON peer_reviews
  FOR DELETE USING (auth.uid() = member_id);
`;

async function executeSQL() {
  console.log("Executing SQL to create peer_reviews table...");
  console.log("Project ref:", projectRef);

  // Try using the database REST endpoint with SQL execution
  // This uses Supabase's pg_graphql or postgres-meta endpoints

  try {
    // First, let's try using the query endpoint that some Supabase instances have
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL })
    });

    if (response.ok) {
      console.log("✓ Table created successfully via RPC!");
      return true;
    }

    // If that fails, output the SQL for manual execution
    console.log("\n❌ Direct SQL execution not available via REST API.");
    console.log("\nPlease execute the following SQL manually in Supabase Dashboard:");
    console.log("URL: https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
    console.log("\n" + "=".repeat(60) + "\n");
    console.log(SQL);
    console.log("\n" + "=".repeat(60) + "\n");

    return false;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
}

executeSQL();
