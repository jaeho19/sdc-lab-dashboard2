-- =============================================
-- SDC Lab Dashboard - Research Tables
-- =============================================

-- ENUM 타입 생성
CREATE TYPE project_category AS ENUM ('thesis', 'submission', 'revision', 'publication', 'other');
CREATE TYPE project_status AS ENUM ('preparing', 'in_progress', 'under_review', 'revision', 'completed', 'on_hold');

-- =============================================
-- research_projects 테이블
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

-- 인덱스
CREATE INDEX idx_research_projects_status ON research_projects(status);
CREATE INDEX idx_research_projects_category ON research_projects(category);
CREATE INDEX idx_research_projects_created_by ON research_projects(created_by);
CREATE INDEX idx_research_projects_target_date ON research_projects(target_date);

-- updated_at 트리거
CREATE TRIGGER update_research_projects_updated_at
    BEFORE UPDATE ON research_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Research projects are viewable by authenticated users"
    ON research_projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create research projects"
    ON research_projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators and professors can update projects"
    ON research_projects FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

CREATE POLICY "Only professors can delete projects"
    ON research_projects FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- project_members 테이블 (프로젝트-연구원 매핑)
-- =============================================
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, member_id)
);

-- 인덱스
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_member ON project_members(member_id);

-- RLS 활성화
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Project members are viewable by authenticated users"
    ON project_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Project creators and professors can manage project members"
    ON project_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- milestones 테이블
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

-- 인덱스
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_order ON milestones(project_id, order_index);

-- updated_at 트리거
CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Milestones are viewable by authenticated users"
    ON milestones FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Project members can manage milestones"
    ON milestones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = milestones.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- =============================================
-- checklist_items 테이블
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

-- 인덱스
CREATE INDEX idx_checklist_items_milestone ON checklist_items(milestone_id);
CREATE INDEX idx_checklist_items_order ON checklist_items(milestone_id, order_index);

-- updated_at 트리거
CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Checklist items are viewable by authenticated users"
    ON checklist_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Project members can manage checklist items"
    ON checklist_items FOR ALL
    TO authenticated
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
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- 코멘트 추가
COMMENT ON TABLE research_projects IS '연구 프로젝트';
COMMENT ON COLUMN research_projects.overall_progress IS '전체 진행률 (0-100), 마일스톤 가중치 기반 자동 계산';
COMMENT ON COLUMN research_projects.flowchart_md IS '연구 흐름도 마크다운';

COMMENT ON TABLE project_members IS '프로젝트 참여 연구원';
COMMENT ON COLUMN project_members.role IS '역할 (예: lead, member, advisor)';

COMMENT ON TABLE milestones IS '프로젝트 마일스톤';
COMMENT ON COLUMN milestones.weight IS '진행률 계산 시 가중치';
COMMENT ON COLUMN milestones.progress IS '마일스톤 진행률 (체크리스트 기반 자동 계산)';

COMMENT ON TABLE checklist_items IS '마일스톤 체크리스트 항목';
