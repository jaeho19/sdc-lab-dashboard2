-- SDC Lab Dashboard - Database Schema
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. MEMBERS (연구원 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  profile_image_url TEXT,
  position VARCHAR(20) NOT NULL CHECK (position IN ('professor', 'post_doc', 'phd', 'researcher', 'ms')),
  employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time')),
  enrollment_year INT,
  expected_graduation_year INT,
  is_completed BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'graduated', 'leave')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. RESEARCH_PROJECTS (연구 프로젝트)
-- ============================================
CREATE TABLE IF NOT EXISTS research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('thesis', 'submission', 'revision', 'individual', 'grant')),
  tag VARCHAR(50),
  target_journal VARCHAR(200),
  target_submission_date DATE,
  target_publication_date DATE,
  status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing', 'submitting', 'under_review', 'revision', 'accepted', 'published')),
  overall_progress INT DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  flowchart_md_path TEXT,
  flowchart_md_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PROJECT_MEMBERS (프로젝트-연구원 매핑)
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('first_author', 'corresponding', 'co_author')),
  responsibilities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- ============================================
-- 4. MILESTONES (연구 단계별 진행)
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
  stage VARCHAR(30) NOT NULL CHECK (stage IN (
    'literature_review', 'methodology', 'data_collection', 'analysis',
    'draft_writing', 'submission', 'review_revision', 'publication'
  )),
  weight INT DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  is_current BOOLEAN DEFAULT FALSE,
  completed_at DATE,
  notes TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, stage)
);

-- ============================================
-- 5. CHECKLIST_ITEMS (체크리스트 항목)
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CALENDAR_EVENTS (일정)
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  category VARCHAR(20) NOT NULL CHECK (category IN (
    'lab_meeting', 'conference', 'social', 'deadline',
    'seminar', 'study', 'field_trip', 'vacation'
  )),
  is_shared BOOLEAN DEFAULT TRUE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MEMBER_COURSES (수강 교과목)
-- ============================================
CREATE TABLE IF NOT EXISTS member_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  course_name VARCHAR(200) NOT NULL,
  semester VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. MENTORING_POSTS (멘토링 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS mentoring_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  meeting_date DATE,
  professor_comments TEXT,
  next_steps TEXT[],
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. MENTORING_COMMENTS (멘토링 댓글)
-- ============================================
CREATE TABLE IF NOT EXISTS mentoring_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES mentoring_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. MENTORING_LIKES (좋아요)
-- ============================================
CREATE TABLE IF NOT EXISTS mentoring_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES mentoring_posts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, member_id)
);

-- ============================================
-- 11. FILES (첨부파일)
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES members(id) ON DELETE SET NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('project', 'mentoring_post', 'flowchart')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. NOTIFICATIONS (알림)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'deadline_reminder', 'mentoring_comment', 'mentoring_like', 'project_update'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  entity_type VARCHAR(20),
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_position ON members(position);

CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_research_projects_category ON research_projects(category);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_member_id ON project_members(member_id);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_milestone_id ON checklist_items(milestone_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_member_id ON calendar_events(member_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_datetime ON calendar_events(start_datetime);

CREATE INDEX IF NOT EXISTS idx_mentoring_posts_author_id ON mentoring_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_posts_created_at ON mentoring_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentoring_comments_post_id ON mentoring_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_likes_post_id ON mentoring_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE members IS '연구원 정보 테이블';
COMMENT ON TABLE research_projects IS '연구 프로젝트 테이블';
COMMENT ON TABLE project_members IS '프로젝트-연구원 매핑 테이블';
COMMENT ON TABLE milestones IS '연구 단계별 진행 테이블';
COMMENT ON TABLE checklist_items IS '체크리스트 항목 테이블';
COMMENT ON TABLE calendar_events IS '일정 테이블';
COMMENT ON TABLE member_courses IS '수강 교과목 테이블';
COMMENT ON TABLE mentoring_posts IS '멘토링 기록 테이블';
COMMENT ON TABLE mentoring_comments IS '멘토링 댓글 테이블';
COMMENT ON TABLE mentoring_likes IS '좋아요 테이블';
COMMENT ON TABLE files IS '첨부파일 테이블';
COMMENT ON TABLE notifications IS '알림 테이블';
