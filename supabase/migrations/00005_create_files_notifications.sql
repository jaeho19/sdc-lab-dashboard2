-- =============================================
-- SDC Lab Dashboard - Files & Notifications Tables
-- =============================================

-- ENUM 타입 생성
CREATE TYPE file_entity_type AS ENUM ('project', 'mentoring');
CREATE TYPE notification_type AS ENUM ('deadline', 'comment', 'like', 'project_update');

-- =============================================
-- files 테이블
-- =============================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    entity_type file_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- RLS 활성화
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Files are viewable by authenticated users"
    ON files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can upload files"
    ON files FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploaders and professors can delete files"
    ON files FOR DELETE
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- notifications 테이블
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_unread ON notifications(member_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(member_id, created_at DESC);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 알림만 조회 가능
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

-- RLS 정책: 시스템에서 생성 (service_role 사용)
-- 일반 사용자는 INSERT 불가, 트리거나 Edge Function에서 생성
CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (false); -- 일반 사용자는 직접 생성 불가

-- RLS 정책: 본인 알림 읽음 처리
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (member_id = auth.uid())
    WITH CHECK (member_id = auth.uid());

-- RLS 정책: 본인 알림 삭제
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (member_id = auth.uid());

-- 코멘트 추가
COMMENT ON TABLE files IS '첨부 파일 메타데이터';
COMMENT ON COLUMN files.storage_path IS 'Supabase Storage 내 파일 경로';
COMMENT ON COLUMN files.entity_type IS '파일이 속한 엔티티 종류 (project, mentoring)';
COMMENT ON COLUMN files.entity_id IS '파일이 속한 엔티티 ID';

COMMENT ON TABLE notifications IS '알림';
COMMENT ON COLUMN notifications.type IS 'deadline: 마감일, comment: 댓글, like: 좋아요, project_update: 프로젝트 업데이트';
COMMENT ON COLUMN notifications.link IS '알림 클릭 시 이동할 URL';
