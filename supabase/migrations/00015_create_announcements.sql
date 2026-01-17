-- 공지사항 테이블 생성
-- Migration: 00015_create_announcements.sql

-- ENUM 타입 생성
CREATE TYPE announcement_priority AS ENUM ('normal', 'important', 'urgent');

-- announcements 테이블 생성
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority announcement_priority NOT NULL DEFAULT 'normal',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    author_id UUID REFERENCES members(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned DESC);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- RLS 활성화
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자가 조회 가능
CREATE POLICY "Announcements viewable by authenticated users"
    ON announcements FOR SELECT
    TO authenticated
    USING (true);

-- RLS 정책: professor만 생성 가능
CREATE POLICY "Professors can insert announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id = auth.uid() AND members.position = 'professor'
        )
    );

-- RLS 정책: professor만 수정 가능
CREATE POLICY "Professors can update announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id = auth.uid() AND members.position = 'professor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id = auth.uid() AND members.position = 'professor'
        )
    );

-- RLS 정책: professor만 삭제 가능
CREATE POLICY "Professors can delete announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE members.user_id = auth.uid() AND members.position = 'professor'
        )
    );

-- 코멘트 추가
COMMENT ON TABLE announcements IS '연구실 공지사항';
COMMENT ON COLUMN announcements.priority IS 'normal: 일반, important: 중요, urgent: 긴급';
COMMENT ON COLUMN announcements.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN announcements.expires_at IS '공지 만료일 (null이면 무기한)';
