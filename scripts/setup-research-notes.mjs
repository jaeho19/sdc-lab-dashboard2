// Research Notes 테이블 생성 스크립트
// 실행: node scripts/setup-research-notes.mjs

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
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndCreateTables() {
  console.log('🔍 Checking research_notes table...');

  // Check if research_notes table exists
  const { data: notesData, error: notesError } = await supabase
    .from('research_notes')
    .select('id')
    .limit(1);

  if (notesError && notesError.code === '42P01') {
    console.log('❌ research_notes 테이블이 존재하지 않습니다.');
    console.log('\n📋 아래 SQL을 Supabase SQL Editor에서 실행하세요:\n');
    printSQL();
    return;
  } else if (notesError) {
    console.log('Error checking research_notes:', notesError.message);
  } else {
    console.log('✅ research_notes 테이블이 존재합니다!');
  }

  // Check if research_note_comments table exists
  const { data: commentsData, error: commentsError } = await supabase
    .from('research_note_comments')
    .select('id')
    .limit(1);

  if (commentsError && commentsError.code === '42P01') {
    console.log('❌ research_note_comments 테이블이 존재하지 않습니다.');
    console.log('\n📋 아래 SQL을 Supabase SQL Editor에서 실행하세요:\n');
    printSQL();
    return;
  } else if (commentsError) {
    console.log('Error checking research_note_comments:', commentsError.message);
  } else {
    console.log('✅ research_note_comments 테이블이 존재합니다!');
  }

  console.log('\n🎉 모든 테이블이 준비되었습니다!');
}

function printSQL() {
  console.log(`
-- ================================
-- research_notes 테이블
-- ================================
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

DROP POLICY IF EXISTS "연구노트 조회" ON research_notes;
CREATE POLICY "연구노트 조회" ON research_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "연구노트 생성" ON research_notes;
CREATE POLICY "연구노트 생성" ON research_notes FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "연구노트 수정" ON research_notes;
CREATE POLICY "연구노트 수정" ON research_notes FOR UPDATE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);

DROP POLICY IF EXISTS "연구노트 삭제" ON research_notes;
CREATE POLICY "연구노트 삭제" ON research_notes FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);

-- ================================
-- research_note_comments 테이블
-- ================================
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

DROP POLICY IF EXISTS "댓글 조회" ON research_note_comments;
CREATE POLICY "댓글 조회" ON research_note_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "댓글 생성" ON research_note_comments;
CREATE POLICY "댓글 생성" ON research_note_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "댓글 수정" ON research_note_comments;
CREATE POLICY "댓글 수정" ON research_note_comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "댓글 삭제" ON research_note_comments;
CREATE POLICY "댓글 삭제" ON research_note_comments FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);
  `);
}

checkAndCreateTables().catch(console.error);
