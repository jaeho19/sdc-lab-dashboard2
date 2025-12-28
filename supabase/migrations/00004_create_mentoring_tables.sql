-- =============================================
-- SDC Lab Dashboard - Mentoring Tables
-- =============================================

-- =============================================
-- mentoring_posts 테이블
-- =============================================
CREATE TABLE mentoring_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    content TEXT NOT NULL,
    professor_comment TEXT,
    next_steps TEXT[],
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mentoring_posts_author ON mentoring_posts(author_id);
CREATE INDEX idx_mentoring_posts_meeting_date ON mentoring_posts(meeting_date DESC);
CREATE INDEX idx_mentoring_posts_created_at ON mentoring_posts(created_at DESC);

-- updated_at 트리거
CREATE TRIGGER update_mentoring_posts_updated_at
    BEFORE UPDATE ON mentoring_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE mentoring_posts ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Mentoring posts are viewable by authenticated users"
    ON mentoring_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create mentoring posts"
    ON mentoring_posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own posts"
    ON mentoring_posts FOR UPDATE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

CREATE POLICY "Authors and professors can delete posts"
    ON mentoring_posts FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- mentoring_comments 테이블
-- =============================================
CREATE TABLE mentoring_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mentoring_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mentoring_comments_post ON mentoring_comments(post_id);
CREATE INDEX idx_mentoring_comments_author ON mentoring_comments(author_id);
CREATE INDEX idx_mentoring_comments_created_at ON mentoring_comments(post_id, created_at);

-- updated_at 트리거
CREATE TRIGGER update_mentoring_comments_updated_at
    BEFORE UPDATE ON mentoring_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE mentoring_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Comments are viewable by authenticated users"
    ON mentoring_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create comments"
    ON mentoring_comments FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own comments"
    ON mentoring_comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "Authors and professors can delete comments"
    ON mentoring_comments FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- mentoring_likes 테이블
-- =============================================
CREATE TABLE mentoring_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mentoring_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, member_id)
);

-- 인덱스
CREATE INDEX idx_mentoring_likes_post ON mentoring_likes(post_id);
CREATE INDEX idx_mentoring_likes_member ON mentoring_likes(member_id);

-- RLS 활성화
ALTER TABLE mentoring_likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Likes are viewable by authenticated users"
    ON mentoring_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own likes"
    ON mentoring_likes FOR INSERT
    TO authenticated
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
    ON mentoring_likes FOR DELETE
    TO authenticated
    USING (member_id = auth.uid());

-- 코멘트 추가
COMMENT ON TABLE mentoring_posts IS '멘토링 기록 게시물';
COMMENT ON COLUMN mentoring_posts.meeting_date IS '멘토링 미팅 날짜';
COMMENT ON COLUMN mentoring_posts.professor_comment IS '교수 코멘트';
COMMENT ON COLUMN mentoring_posts.next_steps IS '다음 단계 목록';
COMMENT ON COLUMN mentoring_posts.likes_count IS '좋아요 수 (트리거로 자동 계산)';

COMMENT ON TABLE mentoring_comments IS '멘토링 게시물 댓글';
COMMENT ON TABLE mentoring_likes IS '멘토링 게시물 좋아요';
