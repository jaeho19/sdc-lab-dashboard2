-- Migration: 00021_create_sub_projects_table.sql

CREATE TABLE sub_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                  -- "26121" 같은 단위사업 코드
  name TEXT NOT NULL,                  -- "거버넌스 역량강화"
  sort_order INT NOT NULL DEFAULT 0,   -- 보고서에서의 표시 순서
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sub_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sub_projects"
  ON sub_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sub_projects"
  ON sub_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

-- Index
CREATE INDEX idx_sub_projects_project_id ON sub_projects (project_id);
CREATE INDEX idx_sub_projects_code ON sub_projects (code);
