-- Migration: 00022_create_progress_logs_table.sql

CREATE TYPE progress_log_type AS ENUM (
  'task',        -- 일반 업무
  'meeting',     -- 회의
  'report',      -- 보고
  'consulting',  -- 컨설팅
  'fieldwork',   -- 현장활동
  'other'        -- 기타
);

CREATE TYPE progress_log_status AS ENUM (
  'completed',   -- 완료
  'in_progress', -- 진행중
  'planned'      -- 계획 (차주/차월 반영용)
);

CREATE TABLE progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sub_project_id UUID REFERENCES sub_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  log_date DATE NOT NULL,
  log_type progress_log_type NOT NULL DEFAULT 'task',
  status progress_log_status NOT NULL DEFAULT 'completed',
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  assignee_name TEXT,                  -- 비회원 담당자 이름 (fallback)
  hours_spent NUMERIC(4,1),            -- 투입 시간 (선택)
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read progress_logs"
  ON progress_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert progress_logs"
  ON progress_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update own progress_logs"
  ON progress_logs FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own progress_logs"
  ON progress_logs FOR DELETE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE id = auth.uid()
    )
  );

-- Indexes (핵심: 기간별 조회 성능)
CREATE INDEX idx_progress_logs_project_date ON progress_logs (project_id, log_date);
CREATE INDEX idx_progress_logs_sub_project ON progress_logs (sub_project_id);
CREATE INDEX idx_progress_logs_assignee ON progress_logs (assignee_id);
CREATE INDEX idx_progress_logs_date ON progress_logs (log_date);
CREATE INDEX idx_progress_logs_status ON progress_logs (status);
