// Research Notes 테이블 생성 SQL 출력
// 실행: node scripts/create-research-notes-tables.mjs
// 출력된 SQL을 Supabase SQL Editor에서 실행하세요.

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

CREATE POLICY "연구노트 조회" ON research_notes FOR SELECT USING (true);
CREATE POLICY "연구노트 생성" ON research_notes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "연구노트 수정" ON research_notes FOR UPDATE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);
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

CREATE POLICY "댓글 조회" ON research_note_comments FOR SELECT USING (true);
CREATE POLICY "댓글 생성" ON research_note_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "댓글 수정" ON research_note_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "댓글 삭제" ON research_note_comments FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
);
  `);
}

// 스크립트 실행 시 SQL 출력
console.log("=== Research Notes 테이블 생성 SQL ===\n");
printSQL();
console.log("\n위 SQL을 Supabase SQL Editor에서 실행해주세요.");
console.log("(https://supabase.com/dashboard → SQL Editor)");
