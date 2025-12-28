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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPeerReviewsTable() {
  console.log("Creating peer_reviews table...");

  // Check if table exists
  const { error: checkError } = await supabase.from("peer_reviews").select("id").limit(1);

  if (!checkError) {
    console.log("peer_reviews table already exists!");
    return;
  }

  if (checkError.code !== "42P01") {
    console.error("Error checking table:", checkError);
    return;
  }

  console.log("Table doesn't exist. Please run the following SQL in Supabase Dashboard SQL Editor:");
  console.log(`
-- Create peer_reviews table
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
CREATE INDEX idx_peer_reviews_project_id ON peer_reviews(project_id);
CREATE INDEX idx_peer_reviews_created_at ON peer_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own peer reviews" ON peer_reviews
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Admins can view all peer reviews" ON peer_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid() AND position = 'professor'
    )
  );

CREATE POLICY "Users can insert own peer reviews" ON peer_reviews
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update own peer reviews" ON peer_reviews
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete own peer reviews" ON peer_reviews
  FOR DELETE USING (auth.uid() = member_id);
  `);
}

createPeerReviewsTable().catch(console.error);
