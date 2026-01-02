-- =============================================
-- SDC Lab Dashboard - Milestone Completed At
-- 마일스톤 완료 시점 자동 기록
-- =============================================

-- 1. milestones 테이블에 completed_at 필드 추가
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. 기존 100% 완료된 마일스톤에 completed_at 설정 (updated_at 기준)
UPDATE milestones
SET completed_at = updated_at
WHERE progress = 100 AND completed_at IS NULL;

-- 3. 마일스톤 진행률 변경 시 completed_at 자동 설정 트리거
CREATE OR REPLACE FUNCTION set_milestone_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 진행률이 100%에 도달하면 완료 시점 기록
    IF NEW.progress = 100 AND (OLD.progress IS NULL OR OLD.progress < 100) THEN
        NEW.completed_at = NOW();
    -- 진행률이 100% 미만으로 돌아가면 완료 시점 초기화
    ELSIF NEW.progress < 100 AND OLD.progress = 100 THEN
        NEW.completed_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제
DROP TRIGGER IF EXISTS trigger_set_milestone_completed_at ON milestones;

-- 마일스톤 progress 변경 시 트리거 실행
CREATE TRIGGER trigger_set_milestone_completed_at
    BEFORE UPDATE OF progress ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION set_milestone_completed_at();

-- 코멘트 추가
COMMENT ON COLUMN milestones.completed_at IS '마일스톤 100% 달성 시 자동 기록되는 완료 시점';
COMMENT ON FUNCTION set_milestone_completed_at IS '마일스톤 진행률 100% 도달 시 completed_at 자동 설정';
