-- =============================================
-- SDC Lab Dashboard - Research Meetings
-- =============================================

-- =============================================
-- research_meetings 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS research_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    discussion_content TEXT NOT NULL,
    next_steps TEXT,
    author_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_research_meetings_project ON research_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_research_meetings_date ON research_meetings(meeting_date DESC);

-- updated_at 트리거
CREATE TRIGGER update_research_meetings_updated_at
    BEFORE UPDATE ON research_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE research_meetings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 조회 - 인증 사용자 전체
CREATE POLICY "Research meetings are viewable by authenticated users"
    ON research_meetings FOR SELECT
    TO authenticated
    USING (true);

-- RLS 정책: CUD - 프로젝트 멤버, 생성자, 교수
CREATE POLICY "Project members can manage research meetings"
    ON research_meetings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = research_meetings.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = research_meetings.project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- 코멘트 추가
COMMENT ON TABLE research_meetings IS '연구 미팅 기록';
COMMENT ON COLUMN research_meetings.meeting_date IS '미팅 날짜';
COMMENT ON COLUMN research_meetings.discussion_content IS '회의 내용';
COMMENT ON COLUMN research_meetings.next_steps IS '다음 미팅까지 할 일';
COMMENT ON COLUMN research_meetings.author_id IS '작성자 ID';
