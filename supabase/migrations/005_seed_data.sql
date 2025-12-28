-- SDC Lab Dashboard - Initial Seed Data
-- 주의: 이 파일은 관리자 계정 생성 후 실행하세요

-- ============================================
-- 샘플 연구 프로젝트 (테스트용)
-- ============================================

-- 프로젝트 1: 도시 데이터 분석
INSERT INTO research_projects (id, title, category, tag, target_journal, status, overall_progress)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '도시 공간 데이터를 활용한 커뮤니티 활성화 연구',
  'submission',
  'Urban Analytics',
  'Journal of Urban Planning',
  'under_review',
  65
);

-- 프로젝트 1의 마일스톤
INSERT INTO milestones (project_id, stage, weight, is_current, sort_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'literature_review', 10, false, 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'methodology', 15, false, 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'data_collection', 20, false, 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'analysis', 25, true, 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'draft_writing', 15, false, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'submission', 10, false, 6),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'review_revision', 3, false, 7),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'publication', 2, false, 8);

-- 프로젝트 2: GIS 기반 연구
INSERT INTO research_projects (id, title, category, tag, target_journal, status, overall_progress)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'GIS 기반 공간 접근성 분석 방법론 개발',
  'thesis',
  'GIS',
  NULL,
  'preparing',
  25
);

-- 프로젝트 2의 마일스톤
INSERT INTO milestones (project_id, stage, weight, is_current, sort_order) VALUES
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'literature_review', 15, false, 1),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'methodology', 20, true, 2),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'data_collection', 20, false, 3),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'analysis', 25, false, 4),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'draft_writing', 15, false, 5),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'publication', 5, false, 6);

-- ============================================
-- 샘플 캘린더 이벤트
-- ============================================

INSERT INTO calendar_events (title, description, start_datetime, end_datetime, is_all_day, category, is_shared) VALUES
('정기 랩미팅', '매주 월요일 정기 랩미팅', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', false, 'lab_meeting', true),
('논문 투고 마감', 'Journal of Urban Planning 투고 마감일', NOW() + INTERVAL '30 days', NULL, true, 'deadline', true),
('학회 참석', 'International Conference on Urban Analytics', NOW() + INTERVAL '60 days', NOW() + INTERVAL '62 days', true, 'conference', true);

-- ============================================
-- 사용법 안내
-- ============================================
-- 1. Supabase Dashboard에서 Authentication > Users에서 관리자 계정 생성
-- 2. members 테이블에 관리자 레코드 수동 추가:
--
-- INSERT INTO members (user_id, name, email, position, employment_type, status)
-- VALUES (
--   '관리자_user_id_여기에_입력',
--   '이재호',
--   'jaeho@uos.ac.kr',
--   'professor',
--   'full_time',
--   'active'
-- );
--
-- 3. 이후 다른 연구원들은 자가 가입 후 관리자가 승인
