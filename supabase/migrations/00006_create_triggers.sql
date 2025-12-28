-- =============================================
-- SDC Lab Dashboard - Database Triggers
-- =============================================

-- =============================================
-- 1. 마일스톤 진행률 자동 계산
-- (체크리스트 항목 변경 시)
-- =============================================
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_milestone_id UUID;
    v_total INTEGER;
    v_completed INTEGER;
    v_progress INTEGER;
BEGIN
    -- 삭제 시에는 OLD, 그 외에는 NEW 사용
    IF TG_OP = 'DELETE' THEN
        v_milestone_id := OLD.milestone_id;
    ELSE
        v_milestone_id := NEW.milestone_id;
    END IF;

    -- 해당 마일스톤의 체크리스트 통계 계산
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE is_completed = TRUE)
    INTO v_total, v_completed
    FROM checklist_items
    WHERE milestone_id = v_milestone_id;

    -- 진행률 계산 (0으로 나누기 방지)
    IF v_total > 0 THEN
        v_progress := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    -- 마일스톤 진행률 업데이트
    UPDATE milestones
    SET progress = v_progress
    WHERE id = v_milestone_id;

    -- 프로젝트 전체 진행률도 업데이트
    PERFORM update_project_progress_by_milestone(v_milestone_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 체크리스트 변경 시 트리거
CREATE TRIGGER trigger_update_milestone_progress
    AFTER INSERT OR UPDATE OF is_completed OR DELETE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_progress();

-- =============================================
-- 2. 프로젝트 전체 진행률 자동 계산
-- (마일스톤 기반 가중치 계산)
-- =============================================
CREATE OR REPLACE FUNCTION update_project_progress_by_milestone(p_milestone_id UUID)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
    v_overall_progress INTEGER;
BEGIN
    -- 마일스톤으로부터 프로젝트 ID 조회
    SELECT project_id INTO v_project_id
    FROM milestones
    WHERE id = p_milestone_id;

    IF v_project_id IS NULL THEN
        RETURN;
    END IF;

    -- 가중치 기반 전체 진행률 계산
    SELECT
        COALESCE(
            ROUND(
                SUM(weight * progress)::NUMERIC / NULLIF(SUM(weight), 0)::NUMERIC
            ),
            0
        )
    INTO v_overall_progress
    FROM milestones
    WHERE project_id = v_project_id;

    -- 프로젝트 진행률 업데이트
    UPDATE research_projects
    SET overall_progress = v_overall_progress
    WHERE id = v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 마일스톤 가중치/진행률 직접 변경 시 트리거
CREATE OR REPLACE FUNCTION trigger_update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- 삭제된 마일스톤의 프로젝트 진행률 재계산
        PERFORM update_project_progress_by_project(OLD.project_id);
        RETURN OLD;
    ELSE
        PERFORM update_project_progress_by_project(NEW.project_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_project_progress_by_project(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
    v_overall_progress INTEGER;
BEGIN
    SELECT
        COALESCE(
            ROUND(
                SUM(weight * progress)::NUMERIC / NULLIF(SUM(weight), 0)::NUMERIC
            ),
            0
        )
    INTO v_overall_progress
    FROM milestones
    WHERE project_id = p_project_id;

    UPDATE research_projects
    SET overall_progress = v_overall_progress
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_milestone_changes
    AFTER INSERT OR UPDATE OF weight, progress OR DELETE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_progress();

-- =============================================
-- 3. 좋아요 카운트 자동 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mentoring_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mentoring_posts
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON mentoring_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_count();

-- =============================================
-- 4. 댓글 알림 생성
-- =============================================
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_commenter_name TEXT;
BEGIN
    -- 게시물 작성자 조회
    SELECT author_id INTO v_post_author_id
    FROM mentoring_posts
    WHERE id = NEW.post_id;

    -- 본인 게시물에 댓글 달면 알림 생성 안함
    IF v_post_author_id = NEW.author_id THEN
        RETURN NEW;
    END IF;

    -- 댓글 작성자 이름 조회
    SELECT name INTO v_commenter_name
    FROM members
    WHERE id = NEW.author_id;

    -- 알림 생성
    INSERT INTO notifications (member_id, type, title, message, link)
    VALUES (
        v_post_author_id,
        'comment',
        '새 댓글',
        v_commenter_name || '님이 회원님의 멘토링 기록에 댓글을 남겼습니다.',
        '/mentoring/' || NEW.post_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_comment_notification
    AFTER INSERT ON mentoring_comments
    FOR EACH ROW
    EXECUTE FUNCTION create_comment_notification();

-- =============================================
-- 5. 좋아요 알림 생성
-- =============================================
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_liker_name TEXT;
BEGIN
    -- 게시물 작성자 조회
    SELECT author_id INTO v_post_author_id
    FROM mentoring_posts
    WHERE id = NEW.post_id;

    -- 본인 게시물에 좋아요하면 알림 생성 안함
    IF v_post_author_id = NEW.member_id THEN
        RETURN NEW;
    END IF;

    -- 좋아요 누른 사람 이름 조회
    SELECT name INTO v_liker_name
    FROM members
    WHERE id = NEW.member_id;

    -- 알림 생성
    INSERT INTO notifications (member_id, type, title, message, link)
    VALUES (
        v_post_author_id,
        'like',
        '좋아요',
        v_liker_name || '님이 회원님의 멘토링 기록을 좋아합니다.',
        '/mentoring/' || NEW.post_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_like_notification
    AFTER INSERT ON mentoring_likes
    FOR EACH ROW
    EXECUTE FUNCTION create_like_notification();

-- =============================================
-- notifications 테이블 INSERT 정책 수정
-- (트리거에서 SECURITY DEFINER로 생성 가능하도록)
-- =============================================
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- 코멘트 추가
COMMENT ON FUNCTION update_milestone_progress IS '체크리스트 변경 시 마일스톤 진행률 자동 계산';
COMMENT ON FUNCTION update_project_progress_by_milestone IS '마일스톤 변경 시 프로젝트 전체 진행률 자동 계산';
COMMENT ON FUNCTION update_likes_count IS '좋아요 추가/삭제 시 카운트 자동 업데이트';
COMMENT ON FUNCTION create_comment_notification IS '댓글 작성 시 알림 생성';
COMMENT ON FUNCTION create_like_notification IS '좋아요 시 알림 생성';
