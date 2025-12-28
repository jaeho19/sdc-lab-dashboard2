-- SDC Lab Dashboard - Row Level Security Policies
-- 이 파일을 001_create_tables.sql 실행 후에 실행하세요

-- ============================================
-- Helper Functions
-- ============================================

-- 현재 사용자의 member_id를 가져오는 함수
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- 현재 사용자가 관리자(professor)인지 확인하는 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() AND position = 'professor'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- 현재 사용자가 active 상태인지 확인하는 함수
CREATE OR REPLACE FUNCTION is_active_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() AND status = 'active'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- MEMBERS Table RLS
-- ============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 active 멤버 조회 가능
CREATE POLICY "Anyone can view active members"
ON members FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (status = 'active' OR user_id = auth.uid())
);

-- 본인 정보만 수정 가능 (status 제외)
CREATE POLICY "Members can update own profile"
ON members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 회원가입 시 새 멤버 생성 가능
CREATE POLICY "Users can create own member record"
ON members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 관리자만 멤버 삭제 가능
CREATE POLICY "Admin can delete members"
ON members FOR DELETE
USING (is_admin());

-- ============================================
-- RESEARCH_PROJECTS Table RLS
-- ============================================
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;

-- active 멤버는 모든 프로젝트 조회 가능
CREATE POLICY "Active members can view all projects"
ON research_projects FOR SELECT
USING (is_active_member());

-- active 멤버는 프로젝트 생성 가능
CREATE POLICY "Active members can create projects"
ON research_projects FOR INSERT
WITH CHECK (is_active_member());

-- active 멤버는 프로젝트 수정 가능
CREATE POLICY "Active members can update projects"
ON research_projects FOR UPDATE
USING (is_active_member());

-- 관리자만 프로젝트 삭제 가능
CREATE POLICY "Admin can delete projects"
ON research_projects FOR DELETE
USING (is_admin());

-- ============================================
-- PROJECT_MEMBERS Table RLS
-- ============================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view project members"
ON project_members FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can manage project members"
ON project_members FOR ALL
USING (is_active_member());

-- ============================================
-- MILESTONES Table RLS
-- ============================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view milestones"
ON milestones FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can manage milestones"
ON milestones FOR ALL
USING (is_active_member());

-- ============================================
-- CHECKLIST_ITEMS Table RLS
-- ============================================
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view checklist items"
ON checklist_items FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can manage checklist items"
ON checklist_items FOR ALL
USING (is_active_member());

-- ============================================
-- CALENDAR_EVENTS Table RLS
-- ============================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 모든 active 멤버는 모든 일정 조회 가능
CREATE POLICY "Active members can view all events"
ON calendar_events FOR SELECT
USING (is_active_member());

-- 본인 일정만 생성 가능
CREATE POLICY "Members can create own events"
ON calendar_events FOR INSERT
WITH CHECK (
  is_active_member() AND
  (member_id = get_current_member_id() OR created_by = get_current_member_id())
);

-- 본인 일정만 수정 가능
CREATE POLICY "Members can update own events"
ON calendar_events FOR UPDATE
USING (
  member_id = get_current_member_id() OR
  created_by = get_current_member_id()
);

-- 본인 일정만 삭제 가능
CREATE POLICY "Members can delete own events"
ON calendar_events FOR DELETE
USING (
  member_id = get_current_member_id() OR
  created_by = get_current_member_id()
);

-- ============================================
-- MEMBER_COURSES Table RLS
-- ============================================
ALTER TABLE member_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view all courses"
ON member_courses FOR SELECT
USING (is_active_member());

CREATE POLICY "Members can manage own courses"
ON member_courses FOR ALL
USING (member_id = get_current_member_id());

-- ============================================
-- MENTORING_POSTS Table RLS
-- ============================================
ALTER TABLE mentoring_posts ENABLE ROW LEVEL SECURITY;

-- 모든 active 멤버는 모든 포스트 조회 가능
CREATE POLICY "Active members can view all posts"
ON mentoring_posts FOR SELECT
USING (is_active_member());

-- active 멤버는 포스트 생성 가능
CREATE POLICY "Active members can create posts"
ON mentoring_posts FOR INSERT
WITH CHECK (
  is_active_member() AND
  author_id = get_current_member_id()
);

-- 본인 포스트만 수정 가능
CREATE POLICY "Authors can update own posts"
ON mentoring_posts FOR UPDATE
USING (author_id = get_current_member_id());

-- 본인 또는 관리자만 삭제 가능
CREATE POLICY "Authors or admin can delete posts"
ON mentoring_posts FOR DELETE
USING (
  author_id = get_current_member_id() OR
  is_admin()
);

-- ============================================
-- MENTORING_COMMENTS Table RLS
-- ============================================
ALTER TABLE mentoring_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view all comments"
ON mentoring_comments FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can create comments"
ON mentoring_comments FOR INSERT
WITH CHECK (
  is_active_member() AND
  author_id = get_current_member_id()
);

CREATE POLICY "Authors can update own comments"
ON mentoring_comments FOR UPDATE
USING (author_id = get_current_member_id());

CREATE POLICY "Authors or admin can delete comments"
ON mentoring_comments FOR DELETE
USING (
  author_id = get_current_member_id() OR
  is_admin()
);

-- ============================================
-- MENTORING_LIKES Table RLS
-- ============================================
ALTER TABLE mentoring_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view likes"
ON mentoring_likes FOR SELECT
USING (is_active_member());

CREATE POLICY "Members can manage own likes"
ON mentoring_likes FOR ALL
USING (member_id = get_current_member_id());

-- ============================================
-- FILES Table RLS
-- ============================================
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view files"
ON files FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can upload files"
ON files FOR INSERT
WITH CHECK (
  is_active_member() AND
  uploaded_by = get_current_member_id()
);

CREATE POLICY "Uploaders or admin can delete files"
ON files FOR DELETE
USING (
  uploaded_by = get_current_member_id() OR
  is_admin()
);

-- ============================================
-- NOTIFICATIONS Table RLS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회 가능
CREATE POLICY "Members can view own notifications"
ON notifications FOR SELECT
USING (member_id = get_current_member_id());

-- 본인 알림만 수정 가능 (읽음 표시)
CREATE POLICY "Members can update own notifications"
ON notifications FOR UPDATE
USING (member_id = get_current_member_id());

-- 시스템에서만 알림 생성 (서비스 롤 사용)
-- INSERT는 트리거나 Edge Function에서 처리

-- 본인 알림만 삭제 가능
CREATE POLICY "Members can delete own notifications"
ON notifications FOR DELETE
USING (member_id = get_current_member_id());
