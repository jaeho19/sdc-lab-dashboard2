-- Migration: 00023_create_report_templates_table.sql

CREATE TYPE report_period_type AS ENUM (
  'weekly',      -- 주간
  'monthly',     -- 월간
  'quarterly',   -- 분기
  'custom'       -- 사용자 지정
);

CREATE TYPE report_scope AS ENUM (
  'project',     -- 프로젝트 단위 (주간 공정보고 등)
  'personal'     -- 개인 단위 (월간 업무보고 등)
);

CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "주간 공정보고 (청양읍)"
  description TEXT,
  period_type report_period_type NOT NULL DEFAULT 'weekly',
  scope report_scope NOT NULL DEFAULT 'project',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- 특정 프로젝트용
  sections JSONB NOT NULL DEFAULT '[]',  -- 양식 섹션 정의 (아래 상세)
  header_config JSONB DEFAULT '{}',      -- 헤더 설정 (로고, 기관명 등)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read report_templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage report_templates"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );
