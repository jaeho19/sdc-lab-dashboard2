-- =============================================
-- SDC Lab Dashboard - Submission Status
-- =============================================

-- 투고 상태 enum 생성
CREATE TYPE submission_status AS ENUM (
  'not_submitted',      -- 아직 투고 전 (진행 중인 연구)
  'under_review',       -- 최초 투고 후 심사 대기/진행 중
  'major_revision',     -- 대폭 수정 요청받음
  'minor_revision',     -- 소폭 수정 요청받음
  'revision_submitted', -- 수정본 재투고 완료, 재심사 중
  'accepted'            -- 게재 확정
);

-- research_projects 테이블에 새 컬럼 추가
ALTER TABLE research_projects
ADD COLUMN submission_status submission_status NOT NULL DEFAULT 'not_submitted',
ADD COLUMN submitted_at TIMESTAMPTZ,
ADD COLUMN target_journal TEXT;

-- 인덱스 추가
CREATE INDEX idx_research_projects_submission_status ON research_projects(submission_status);

-- 코멘트 추가
COMMENT ON COLUMN research_projects.submission_status IS '투고 상태: not_submitted(투고전), under_review(심사중), major_revision, minor_revision, revision_submitted(수정본제출), accepted(게재확정)';
COMMENT ON COLUMN research_projects.submitted_at IS '최초 투고 일시';
COMMENT ON COLUMN research_projects.target_journal IS '투고 학회지/저널명';

-- =============================================
-- 진행률 100% 도달 시 자동 전환 트리거
-- =============================================
CREATE OR REPLACE FUNCTION auto_transition_to_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- 진행률이 100%가 되고, 아직 투고 전이면 자동 전환
  IF NEW.overall_progress = 100
     AND (OLD.overall_progress IS NULL OR OLD.overall_progress < 100)
     AND NEW.submission_status = 'not_submitted' THEN
    NEW.submission_status := 'under_review';
    NEW.submitted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_submission_transition
  BEFORE UPDATE ON research_projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_transition_to_submission();

-- =============================================
-- 기존 4건 논문 상태 업데이트
-- =============================================
-- 1. 농촌 태양광 발전 사업의 주민 수용성 결정 요인 연구 → Under Review
UPDATE research_projects
SET submission_status = 'under_review',
    submitted_at = NOW(),
    target_journal = '한국조경학회지'
WHERE title = '농촌 태양광 발전 사업의 주민 수용성 결정 요인 연구';

-- 2. 광역-기초-생활권을 연계한 경기도 농촌공간 다층적 유형화 모델 개발 → Under Review
UPDATE research_projects
SET submission_status = 'under_review',
    submitted_at = NOW(),
    target_journal = '농촌계획'
WHERE title = '광역-기초-생활권을 연계한 경기도 농촌공간 다층적 유형화 모델 개발';

-- 3. Beyond Distance → Major Revision
UPDATE research_projects
SET submission_status = 'major_revision',
    submitted_at = NOW(),
    target_journal = 'CEUS'
WHERE title LIKE 'Beyond Distance:%';

-- 4. Beyond Proximity → Revision Submitted
UPDATE research_projects
SET submission_status = 'revision_submitted',
    submitted_at = NOW(),
    target_journal = 'Cities'
WHERE title LIKE 'Beyond Proximity:%';
