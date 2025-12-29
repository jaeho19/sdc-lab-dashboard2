-- =============================================
-- Fix weekly_goals RLS policy
-- =============================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Project members can manage weekly goals" ON weekly_goals;

-- SELECT 정책: 인증된 사용자는 모두 조회 가능
CREATE POLICY "Weekly goals are viewable by authenticated users"
    ON weekly_goals FOR SELECT
    TO authenticated
    USING (true);

-- INSERT 정책: 활성 멤버는 목표 추가 가능
CREATE POLICY "Active members can create weekly goals"
    ON weekly_goals FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND status = 'active'
        )
    );

-- UPDATE 정책: 프로젝트 멤버, 생성자, 교수만 수정 가능
CREATE POLICY "Project members can update weekly goals"
    ON weekly_goals FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = weekly_goals.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = weekly_goals.project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- DELETE 정책: 프로젝트 멤버, 생성자, 교수만 삭제 가능
CREATE POLICY "Project members can delete weekly goals"
    ON weekly_goals FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = weekly_goals.project_id AND pm.member_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM research_projects rp
            WHERE rp.id = weekly_goals.project_id AND rp.created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );
