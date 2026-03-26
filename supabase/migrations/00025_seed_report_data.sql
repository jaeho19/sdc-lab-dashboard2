-- Migration: 00025_seed_report_data.sql

-- Project: 청양읍 농촌중심지활성화사업
INSERT INTO projects (code, name, short_name, description, start_date, end_date)
VALUES ('2612', '청양읍 농촌중심지활성화사업 지역역량강화용역', '청양읍', '청양읍 농촌중심지활성화사업 지역역량강화용역', '2025-01-01', '2026-12-31');

-- Sub-projects (단위사업)
INSERT INTO sub_projects (project_id, code, name, sort_order)
SELECT p.id, '26121', '거버넌스 역량강화', 1
FROM projects p WHERE p.code = '2612';

INSERT INTO sub_projects (project_id, code, name, sort_order)
SELECT p.id, '26122', '돌봄공급자 간 협업체계 구축', 2
FROM projects p WHERE p.code = '2612';

INSERT INTO sub_projects (project_id, code, name, sort_order)
SELECT p.id, '26123', '온라인 플랫폼 기획 및 활용', 3
FROM projects p WHERE p.code = '2612';

INSERT INTO sub_projects (project_id, code, name, sort_order)
SELECT p.id, '26124', '현장 프로그램 운영', 4
FROM projects p WHERE p.code = '2612';

INSERT INTO sub_projects (project_id, code, name, sort_order)
SELECT p.id, '26125', '사업 운영 및 관리', 5
FROM projects p WHERE p.code = '2612';

-- Weekly report template (주간 공정보고)
INSERT INTO report_templates (name, description, period_type, scope, project_id, sections, header_config)
SELECT
  '주간 공정보고 (청양읍)',
  '청양읍 농촌중심지활성화사업 주간 공정보고 양식',
  'weekly',
  'project',
  p.id,
  '[
    {
      "id": "progress-table",
      "type": "progress_matrix",
      "title": "사업 추진 현황",
      "columns": [
        {"key": "current_week", "label": "추진경과 (금주)"},
        {"key": "next_week", "label": "추진계획 (차주)"}
      ],
      "auto_fill": {
        "current_week": {"status": ["completed", "in_progress"], "period": "current"},
        "next_week": {"status": ["planned"], "period": "next"}
      }
    },
    {
      "id": "meetings",
      "type": "list",
      "title": "보고 / 회의 등",
      "auto_fill": {"log_type": ["meeting", "report", "consulting"]}
    },
    {
      "id": "remarks",
      "type": "text",
      "title": "기타 사항"
    }
  ]'::jsonb,
  '{"org_name": "충남대학교 지속가능도시공동체연구실", "show_author": true, "show_date": true}'::jsonb
FROM projects p WHERE p.code = '2612';

-- Personal monthly report template (개인 월간보고)
INSERT INTO report_templates (name, description, period_type, scope, sections, header_config)
VALUES (
  '개인 월간 업무보고',
  '개인별 월간 업무 실적 및 계획 보고',
  'monthly',
  'personal',
  '[
    {
      "id": "monthly-performance",
      "type": "progress_matrix",
      "title": "월간 주요 업무 추진실적",
      "columns": [
        {"key": "performance", "label": "추진실적"}
      ],
      "auto_fill": {
        "performance": {"status": ["completed", "in_progress"], "period": "current"}
      }
    },
    {
      "id": "core-tasks",
      "type": "list",
      "title": "핵심 과업",
      "auto_fill": {"status": ["completed"]}
    },
    {
      "id": "collaboration",
      "type": "list",
      "title": "협업 및 대외 업무",
      "auto_fill": {"log_type": ["meeting", "consulting"]}
    },
    {
      "id": "next-month",
      "type": "list",
      "title": "차월 추진계획",
      "auto_fill": {"status": ["planned"]}
    }
  ]'::jsonb,
  '{"org_name": "충남대학교 지속가능도시공동체연구실", "show_author": true, "show_date": true}'::jsonb
);
