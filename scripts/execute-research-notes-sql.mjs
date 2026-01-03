// Research Notes 테이블 생성 SQL 실행
// 실행: node scripts/execute-research-notes-sql.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파일 읽기
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          value = value.replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
  } catch (err) {
    console.error('Error loading .env.local:', err.message);
    process.exit(1);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const sql = `
CREATE TABLE IF NOT EXISTS research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_notes_project ON research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_milestone ON research_notes(milestone_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_author ON research_notes(author_id);

ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "연구노트 조회" ON research_notes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "연구노트 조회" ON research_notes FOR SELECT USING (true);

DO $$ BEGIN
  DROP POLICY IF EXISTS "연구노트 생성" ON research_notes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "연구노트 생성" ON research_notes FOR INSERT WITH CHECK (auth.uid() = author_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "연구노트 수정" ON research_notes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "연구노트 수정" ON research_notes FOR UPDATE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);

DO $$ BEGIN
  DROP POLICY IF EXISTS "연구노트 삭제" ON research_notes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "연구노트 삭제" ON research_notes FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);

CREATE TABLE IF NOT EXISTS research_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES research_notes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_comments_note ON research_note_comments(note_id);

ALTER TABLE research_note_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "댓글 조회" ON research_note_comments;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "댓글 조회" ON research_note_comments FOR SELECT USING (true);

DO $$ BEGIN
  DROP POLICY IF EXISTS "댓글 생성" ON research_note_comments;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "댓글 생성" ON research_note_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "댓글 수정" ON research_note_comments;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "댓글 수정" ON research_note_comments FOR UPDATE USING (auth.uid() = author_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "댓글 삭제" ON research_note_comments;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "댓글 삭제" ON research_note_comments FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);
`;

async function executeSql() {
  console.log('🚀 Executing SQL to create research_notes tables...');
  console.log('Project:', projectRef);

  try {
    // Try using the Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL executed successfully via RPC!');
      return;
    }

    // RPC not available, print SQL for manual execution
    console.log('⚠️  RPC method not available on this Supabase instance.');
    console.log('\n📋 Please run the following SQL in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\n' + '='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 Please run the SQL manually in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  }
}

executeSql();
