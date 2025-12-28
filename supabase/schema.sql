-- =============================================
-- SDC Lab Dashboard - Complete Database Schema
--
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요.
-- 또는 migrations 폴더의 개별 파일을 순서대로 실행하세요.
-- =============================================

-- =============================================
-- 1. ENUM 타입 생성
-- =============================================
CREATE TYPE member_position AS ENUM ('professor', 'post-doc', 'phd', 'ms', 'researcher');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'graduated', 'leave');
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time');
CREATE TYPE project_category AS ENUM ('thesis', 'submission', 'revision', 'publication', 'other');
CREATE TYPE project_status AS ENUM ('preparing', 'in_progress', 'under_review', 'revision', 'completed', 'on_hold');
CREATE TYPE event_category AS ENUM ('meeting', 'deadline', 'seminar', 'holiday', 'personal', 'other');
CREATE TYPE file_entity_type AS ENUM ('project', 'mentoring');
CREATE TYPE notification_type AS ENUM ('deadline', 'comment', 'like', 'project_update');

-- =============================================
-- 2. 공통 함수
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. members 테이블
-- =============================================
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    position member_position NOT NULL DEFAULT 'researcher',
    employment_type employment_type NOT NULL DEFAULT 'full-time',
    status member_status NOT NULL DEFAULT 'pending',
    avatar_url TEXT,
    phone TEXT,
    research_interests TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_position ON members(position);
CREATE INDEX idx_members_email ON members(email);

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members are viewable by authenticated users"
    ON members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own member record"
    ON members FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Professors can update member status"
    ON members FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

CREATE POLICY "Users can insert their own member record"
    ON members FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- =============================================
-- 4. research_projects 테이블
-- =============================================
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category project_category NOT NULL DEFAULT 'other',
    status project_status NOT NULL DEFAULT 'preparing',
    overall_progress INTEGER NOT NULL DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    target_date DATE,
    flowchart_md TEXT,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_projects_status ON research_projects(status);
CREATE INDEX idx_research_projects_category ON research_projects(category);
CREATE INDEX idx_research_projects_created_by ON research_projects(created_by);
CREATE INDEX idx_research_projects_target_date ON research_projects(target_date);

CREATE TRIGGER update_research_projects_updated_at
    BEFORE UPDATE ON research_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Research projects are viewable by authenticated users"
    ON research_projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create research projects"
    ON research_projects FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators and professors can update projects"
    ON research_projects FOR UPDATE TO authenticated
    USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

CREATE POLICY "Only professors can delete projects"
    ON research_projects FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 5. project_members 테이블
-- =============================================
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, member_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_member ON project_members(member_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members are viewable by authenticated users"
    ON project_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project creators and professors can manage project members"
    ON project_members FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM research_projects rp WHERE rp.id = project_id AND rp.created_by = auth.uid())
        OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
    );

-- =============================================
-- 6. milestones 테이블
-- =============================================
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
    order_index INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_order ON milestones(project_id, order_index);

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones are viewable by authenticated users"
    ON milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project members can manage milestones"
    ON milestones FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = milestones.project_id AND pm.member_id = auth.uid())
        OR EXISTS (SELECT 1 FROM research_projects rp WHERE rp.id = project_id AND rp.created_by = auth.uid())
        OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
    );

-- =============================================
-- 7. checklist_items 테이블
-- =============================================
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_milestone ON checklist_items(milestone_id);
CREATE INDEX idx_checklist_items_order ON checklist_items(milestone_id, order_index);

CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checklist items are viewable by authenticated users"
    ON checklist_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Project members can manage checklist items"
    ON checklist_items FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM milestones m
            JOIN project_members pm ON pm.project_id = m.project_id
            WHERE m.id = milestone_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM milestones m
            JOIN research_projects rp ON rp.id = m.project_id
            WHERE m.id = milestone_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')
    );

-- =============================================
-- 8. calendar_events 테이블
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

CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_member ON calendar_events(member_id);
CREATE INDEX idx_calendar_events_public ON calendar_events(is_public);

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public events or their own events"
    ON calendar_events FOR SELECT TO authenticated
    USING (is_public = TRUE OR member_id = auth.uid() OR created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

CREATE POLICY "Users can create events"
    ON calendar_events FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events"
    ON calendar_events FOR UPDATE TO authenticated
    USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

CREATE POLICY "Users can delete their own events"
    ON calendar_events FOR DELETE TO authenticated
    USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 9. member_courses 테이블
-- =============================================
CREATE TABLE member_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_courses_member ON member_courses(member_id);
CREATE INDEX idx_member_courses_semester ON member_courses(semester);

ALTER TABLE member_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by authenticated users"
    ON member_courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own courses"
    ON member_courses FOR ALL TO authenticated
    USING (member_id = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 10. mentoring_posts 테이블
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

CREATE INDEX idx_mentoring_posts_author ON mentoring_posts(author_id);
CREATE INDEX idx_mentoring_posts_meeting_date ON mentoring_posts(meeting_date DESC);
CREATE INDEX idx_mentoring_posts_created_at ON mentoring_posts(created_at DESC);

CREATE TRIGGER update_mentoring_posts_updated_at
    BEFORE UPDATE ON mentoring_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE mentoring_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentoring posts are viewable by authenticated users"
    ON mentoring_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create mentoring posts"
    ON mentoring_posts FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own posts"
    ON mentoring_posts FOR UPDATE TO authenticated
    USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

CREATE POLICY "Authors and professors can delete posts"
    ON mentoring_posts FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 11. mentoring_comments 테이블
-- =============================================
CREATE TABLE mentoring_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mentoring_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentoring_comments_post ON mentoring_comments(post_id);
CREATE INDEX idx_mentoring_comments_author ON mentoring_comments(author_id);

CREATE TRIGGER update_mentoring_comments_updated_at
    BEFORE UPDATE ON mentoring_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE mentoring_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by authenticated users"
    ON mentoring_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments"
    ON mentoring_comments FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own comments"
    ON mentoring_comments FOR UPDATE TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY "Authors and professors can delete comments"
    ON mentoring_comments FOR DELETE TO authenticated
    USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 12. mentoring_likes 테이블
-- =============================================
CREATE TABLE mentoring_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES mentoring_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, member_id)
);

CREATE INDEX idx_mentoring_likes_post ON mentoring_likes(post_id);
CREATE INDEX idx_mentoring_likes_member ON mentoring_likes(member_id);

ALTER TABLE mentoring_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by authenticated users"
    ON mentoring_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own likes"
    ON mentoring_likes FOR INSERT TO authenticated
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
    ON mentoring_likes FOR DELETE TO authenticated
    USING (member_id = auth.uid());

-- =============================================
-- 13. files 테이블
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

CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Files are viewable by authenticated users"
    ON files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload files"
    ON files FOR INSERT TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploaders and professors can delete files"
    ON files FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor'));

-- =============================================
-- 14. notifications 테이블
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

CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_unread ON notifications(member_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(member_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT TO authenticated
    USING (member_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE TO authenticated
    USING (member_id = auth.uid()) WITH CHECK (member_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE TO authenticated
    USING (member_id = auth.uid());

-- =============================================
-- 15. 트리거 함수들
-- =============================================

-- 프로젝트 진행률 계산 함수
CREATE OR REPLACE FUNCTION update_project_progress_by_project(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
    v_overall_progress INTEGER;
BEGIN
    SELECT COALESCE(ROUND(SUM(weight * progress)::NUMERIC / NULLIF(SUM(weight), 0)::NUMERIC), 0)
    INTO v_overall_progress
    FROM milestones
    WHERE project_id = p_project_id;

    UPDATE research_projects
    SET overall_progress = v_overall_progress
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 마일스톤 진행률 계산 함수
CREATE OR REPLACE FUNCTION update_project_progress_by_milestone(p_milestone_id UUID)
RETURNS VOID AS $$
DECLARE
    v_project_id UUID;
BEGIN
    SELECT project_id INTO v_project_id FROM milestones WHERE id = p_milestone_id;
    IF v_project_id IS NOT NULL THEN
        PERFORM update_project_progress_by_project(v_project_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 체크리스트 변경 시 마일스톤 진행률 업데이트
CREATE OR REPLACE FUNCTION update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_milestone_id UUID;
    v_total INTEGER;
    v_completed INTEGER;
    v_progress INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_milestone_id := OLD.milestone_id;
    ELSE
        v_milestone_id := NEW.milestone_id;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = TRUE)
    INTO v_total, v_completed
    FROM checklist_items
    WHERE milestone_id = v_milestone_id;

    IF v_total > 0 THEN
        v_progress := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100);
    ELSE
        v_progress := 0;
    END IF;

    UPDATE milestones SET progress = v_progress WHERE id = v_milestone_id;
    PERFORM update_project_progress_by_milestone(v_milestone_id);

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_milestone_progress
    AFTER INSERT OR UPDATE OF is_completed OR DELETE ON checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_milestone_progress();

-- 마일스톤 변경 시 프로젝트 진행률 업데이트
CREATE OR REPLACE FUNCTION trigger_update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_project_progress_by_project(OLD.project_id);
        RETURN OLD;
    ELSE
        PERFORM update_project_progress_by_project(NEW.project_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_milestone_changes
    AFTER INSERT OR UPDATE OF weight, progress OR DELETE ON milestones
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_progress();

-- 좋아요 카운트 업데이트
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mentoring_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mentoring_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON mentoring_likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 댓글 알림 생성
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_commenter_name TEXT;
BEGIN
    SELECT author_id INTO v_post_author_id FROM mentoring_posts WHERE id = NEW.post_id;
    IF v_post_author_id = NEW.author_id THEN RETURN NEW; END IF;
    SELECT name INTO v_commenter_name FROM members WHERE id = NEW.author_id;
    INSERT INTO notifications (member_id, type, title, message, link)
    VALUES (v_post_author_id, 'comment', '새 댓글', v_commenter_name || '님이 회원님의 멘토링 기록에 댓글을 남겼습니다.', '/mentoring/' || NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_comment_notification
    AFTER INSERT ON mentoring_comments
    FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- 좋아요 알림 생성
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author_id UUID;
    v_liker_name TEXT;
BEGIN
    SELECT author_id INTO v_post_author_id FROM mentoring_posts WHERE id = NEW.post_id;
    IF v_post_author_id = NEW.member_id THEN RETURN NEW; END IF;
    SELECT name INTO v_liker_name FROM members WHERE id = NEW.member_id;
    INSERT INTO notifications (member_id, type, title, message, link)
    VALUES (v_post_author_id, 'like', '좋아요', v_liker_name || '님이 회원님의 멘토링 기록을 좋아합니다.', '/mentoring/' || NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_like_notification
    AFTER INSERT ON mentoring_likes
    FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- =============================================
-- 16. Storage 버킷 생성
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profiles', 'profiles', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('projects', 'projects', FALSE, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'text/markdown', 'text/plain']),
    ('mentoring', 'mentoring', FALSE, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'text/markdown', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책
CREATE POLICY "Profile images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "Users can upload their own profile image" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "Users can update their own profile image" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "Users can delete their own profile image" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Project files are accessible to authenticated users" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'projects');
CREATE POLICY "Authenticated users can upload project files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'projects');
CREATE POLICY "Uploaders and professors can delete project files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'projects' AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')));

CREATE POLICY "Mentoring files are accessible to authenticated users" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mentoring');
CREATE POLICY "Authenticated users can upload mentoring files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mentoring');
CREATE POLICY "Uploaders and professors can delete mentoring files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mentoring' AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND position = 'professor')));

-- =============================================
-- 완료!
-- =============================================
