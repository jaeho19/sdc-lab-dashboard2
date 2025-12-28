import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: "public" },
  auth: { persistSession: false }
});

async function createTable() {
  console.log("Creating peer_reviews table...");

  // Use the REST API to execute SQL via postgres function
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
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
    `
  });

  if (error) {
    console.log("exec_sql not available, trying direct table creation via API...");

    // Try using the Management API instead
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({})
    });

    console.log("\nThe table needs to be created manually.");
    console.log("Please go to Supabase Dashboard > SQL Editor and run the SQL provided.");
    console.log("\nAlternatively, you can use the Supabase Dashboard Table Editor to create the table.");
    return false;
  }

  console.log("Table created successfully!");
  return true;
}

// Alternative: Try to insert a test record to check if table exists
async function checkAndCreateTable() {
  // First check if table exists by trying to select from it
  const { error: checkError } = await supabase
    .from("peer_reviews")
    .select("id")
    .limit(1);

  if (!checkError) {
    console.log("✓ peer_reviews table already exists!");
    return true;
  }

  if (checkError.code === "42P01" || checkError.message.includes("does not exist")) {
    console.log("Table does not exist. Attempting to create...");

    // The Supabase JS client doesn't support raw SQL execution directly
    // We need to use the Management API or Dashboard
    console.log("\n========================================");
    console.log("Please create the table manually in Supabase Dashboard:");
    console.log("1. Go to: https://supabase.com/dashboard/project/vkqeejqbyvcpxrqqshbu/sql");
    console.log("2. Paste and run the following SQL:");
    console.log("========================================\n");

    console.log(`-- Create peer_reviews table
CREATE TABLE peer_reviews (
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

-- Create indexes
CREATE INDEX idx_peer_reviews_member_id ON peer_reviews(member_id);
CREATE INDEX idx_peer_reviews_created_at ON peer_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
`);
    return false;
  }

  console.error("Unexpected error:", checkError);
  return false;
}

checkAndCreateTable();
