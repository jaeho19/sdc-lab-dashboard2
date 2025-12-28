-- SDC Lab Dashboard - Database Triggers
-- 이 파일을 002_rls_policies.sql 실행 후에 실행하세요

-- ============================================
-- 1. updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- members 테이블
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- research_projects 테이블
CREATE TRIGGER update_research_projects_updated_at
  BEFORE UPDATE ON research_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- mentoring_posts 테이블
CREATE TRIGGER update_mentoring_posts_updated_at
  BEFORE UPDATE ON mentoring_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 프로젝트 진행률 자동 계산 트리거
-- ============================================
CREATE OR REPLACE FUNCTION calculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_progress DECIMAL;
BEGIN
  -- milestone을 통해 project_id 조회
  SELECT m.project_id INTO v_project_id
  FROM milestones m
  WHERE m.id = COALESCE(NEW.milestone_id, OLD.milestone_id);

  -- project_id가 없으면 종료
  IF v_project_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 전체 진행률 계산
  -- 각 마일스톤의 (weight * 체크리스트 완료율)의 합
  SELECT COALESCE(SUM(
    m.weight * (
      COALESCE(
        (SELECT COUNT(*) FILTER (WHERE is_completed = true)::DECIMAL /
               NULLIF(COUNT(*), 0)
         FROM checklist_items ci
         WHERE ci.milestone_id = m.id
        ), 0
      )
    )
  ), 0) INTO v_progress
  FROM milestones m
  WHERE m.project_id = v_project_id;

  -- 프로젝트 진행률 업데이트
  UPDATE research_projects
  SET overall_progress = ROUND(v_progress),
      updated_at = NOW()
  WHERE id = v_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 체크리스트 변경 시 트리거
CREATE TRIGGER on_checklist_change
  AFTER INSERT OR UPDATE OR DELETE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION calculate_project_progress();

-- ============================================
-- 3. 좋아요 카운트 업데이트 트리거
-- ============================================
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

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON mentoring_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ============================================
-- 4. 알림 생성 트리거 - 댓글
-- ============================================
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_commenter_name TEXT;
BEGIN
  -- 게시물 작성자 조회
  SELECT author_id INTO v_post_author_id
  FROM mentoring_posts
  WHERE id = NEW.post_id;

  -- 본인 댓글은 알림 생성하지 않음
  IF v_post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- 댓글 작성자 이름 조회
  SELECT name INTO v_commenter_name
  FROM members
  WHERE id = NEW.author_id;

  -- 알림 생성
  INSERT INTO notifications (member_id, type, title, message, entity_type, entity_id)
  VALUES (
    v_post_author_id,
    'mentoring_comment',
    '새 댓글이 달렸습니다',
    v_commenter_name || '님이 댓글을 남겼습니다.',
    'mentoring_post',
    NEW.post_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON mentoring_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ============================================
-- 5. 알림 생성 트리거 - 좋아요
-- ============================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_liker_name TEXT;
BEGIN
  -- 게시물 작성자 조회
  SELECT author_id INTO v_post_author_id
  FROM mentoring_posts
  WHERE id = NEW.post_id;

  -- 본인 좋아요는 알림 생성하지 않음
  IF v_post_author_id = NEW.member_id THEN
    RETURN NEW;
  END IF;

  -- 좋아요 한 사람 이름 조회
  SELECT name INTO v_liker_name
  FROM members
  WHERE id = NEW.member_id;

  -- 알림 생성
  INSERT INTO notifications (member_id, type, title, message, entity_type, entity_id)
  VALUES (
    v_post_author_id,
    'mentoring_like',
    '좋아요를 받았습니다',
    v_liker_name || '님이 좋아요를 눌렀습니다.',
    'mentoring_post',
    NEW.post_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created
  AFTER INSERT ON mentoring_likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ============================================
-- 6. 알림 생성 트리거 - 프로젝트 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION notify_on_project_update()
RETURNS TRIGGER AS $$
DECLARE
  v_member_record RECORD;
BEGIN
  -- 상태나 진행률이 변경된 경우에만
  IF OLD.status = NEW.status AND OLD.overall_progress = NEW.overall_progress THEN
    RETURN NEW;
  END IF;

  -- 프로젝트 참여자들에게 알림
  FOR v_member_record IN
    SELECT member_id FROM project_members WHERE project_id = NEW.id
  LOOP
    INSERT INTO notifications (member_id, type, title, message, entity_type, entity_id)
    VALUES (
      v_member_record.member_id,
      'project_update',
      '프로젝트가 업데이트되었습니다',
      NEW.title || ' 프로젝트가 업데이트되었습니다.',
      'project',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_updated
  AFTER UPDATE ON research_projects
  FOR EACH ROW EXECUTE FUNCTION notify_on_project_update();

-- ============================================
-- 7. 체크리스트 완료 시 완료 시간 기록
-- ============================================
CREATE OR REPLACE FUNCTION set_checklist_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = NOW();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_checklist_completed
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION set_checklist_completed_at();
