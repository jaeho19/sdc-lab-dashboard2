-- =============================================
-- SDC Lab Dashboard - Calendar & Courses Tables
-- =============================================

-- ENUM 타입 생성
CREATE TYPE event_category AS ENUM ('meeting', 'deadline', 'seminar', 'holiday', 'personal', 'other');

-- =============================================
-- calendar_events 테이블
-- =============================================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category event_category NOT NULL DEFAULT 'other',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_member ON calendar_events(member_id);
CREATE INDEX idx_calendar_events_public ON calendar_events(is_public);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- updated_at 트리거
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 공개 일정 또는 본인 일정 조회 가능
CREATE POLICY "Users can view public events or their own events"
    ON calendar_events FOR SELECT
    TO authenticated
    USING (
        is_public = TRUE
        OR member_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- RLS 정책: 본인 일정 생성
CREATE POLICY "Users can create events"
    ON calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- RLS 정책: 본인 일정 또는 교수는 모든 일정 수정 가능
CREATE POLICY "Users can update their own events"
    ON calendar_events FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- RLS 정책: 본인 일정 삭제 또는 교수는 모든 일정 삭제 가능
CREATE POLICY "Users can delete their own events"
    ON calendar_events FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- member_courses 테이블 (수강 교과목)
-- =============================================
CREATE TABLE member_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_member_courses_member ON member_courses(member_id);
CREATE INDEX idx_member_courses_semester ON member_courses(semester);

-- RLS 활성화
ALTER TABLE member_courses ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Courses are viewable by authenticated users"
    ON member_courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own courses"
    ON member_courses FOR ALL
    TO authenticated
    USING (
        member_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- 코멘트 추가
COMMENT ON TABLE calendar_events IS '캘린더 일정';
COMMENT ON COLUMN calendar_events.is_public IS 'TRUE: 공용 일정, FALSE: 개인 일정';
COMMENT ON COLUMN calendar_events.member_id IS '개인 일정인 경우 해당 연구원 ID';
COMMENT ON COLUMN calendar_events.all_day IS '종일 일정 여부';

COMMENT ON TABLE member_courses IS '연구원 수강 교과목';
COMMENT ON COLUMN member_courses.semester IS '학기 (예: 2025-1, 2025-2)';
