-- =============================================
-- SDC Lab Dashboard - Weekly Goals & Timeline
-- =============================================

-- =============================================
-- milestones 테이블에 일정 필드 추가
-- =============================================
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 코멘트 추가
COMMENT ON COLUMN milestones.start_date IS '마일스톤 시작일';
COMMENT ON COLUMN milestones.end_date IS '마일스톤 종료일';

-- =============================================
-- weekly_goals 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    deadline DATE NOT NULL,
    linked_stage TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_weekly_goals_project ON weekly_goals(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_deadline ON weekly_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_completed ON weekly_goals(is_completed);

-- updated_at 트리거
CREATE TRIGGER update_weekly_goals_updated_at
    BEFORE UPDATE ON weekly_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Weekly goals are viewable by authenticated users"
    ON weekly_goals FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Project members can manage weekly goals"
    ON weekly_goals FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = weekly_goals.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- 코멘트 추가
COMMENT ON TABLE weekly_goals IS '주간 목표';
COMMENT ON COLUMN weekly_goals.content IS '목표 내용';
COMMENT ON COLUMN weekly_goals.deadline IS '마감일';
COMMENT ON COLUMN weekly_goals.linked_stage IS '연결된 마일스톤 단계 (literature_review, methodology, data_collection, analysis, draft_writing, submission)';
COMMENT ON COLUMN weekly_goals.is_completed IS '완료 여부';
COMMENT ON COLUMN weekly_goals.completed_at IS '완료 일시';
