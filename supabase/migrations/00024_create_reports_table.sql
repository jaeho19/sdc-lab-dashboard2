-- Migration: 00024_create_reports_table.sql

CREATE TYPE report_status AS ENUM (
  'draft',       -- 작성중
  'submitted',   -- 제출됨
  'approved'     -- 승인됨
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                  -- "2026년 3월 4주차 주간 공정보고 (청양읍)"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,  -- 개인보고 시 담당자
  content JSONB NOT NULL DEFAULT '{}', -- 섹션별 채워진 데이터
  status report_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES members(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete draft reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND created_by IN (
      SELECT id FROM members WHERE id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_reports_template ON reports (template_id);
CREATE INDEX idx_reports_project ON reports (project_id);
CREATE INDEX idx_reports_period ON reports (period_start, period_end);
CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_assignee ON reports (assignee_id);
