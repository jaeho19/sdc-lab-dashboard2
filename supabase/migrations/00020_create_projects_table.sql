-- Migration: 00020_create_projects_table.sql

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- "2612" 같은 사업 코드
  name TEXT NOT NULL,                  -- "청양읍 농촌중심지활성화사업 지역역량강화용역"
  short_name TEXT,                     -- "청양읍" (보고서 표시용 약칭)
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

-- Index
CREATE INDEX idx_projects_code ON projects (code);
CREATE INDEX idx_projects_is_active ON projects (is_active);
