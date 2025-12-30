-- Allow project creators to delete their own projects
-- Previously only admin (professor) could delete projects

-- Drop the existing policy
DROP POLICY IF EXISTS "Admin can delete projects" ON research_projects;

-- Create new policy that allows both admin and project creator to delete
CREATE POLICY "Admin or creator can delete projects"
ON research_projects FOR DELETE
USING (
  is_admin() OR
  created_by = auth.uid()
);

-- Also update project_members delete policy to allow cascading delete
DROP POLICY IF EXISTS "Active members can manage project members" ON project_members;

CREATE POLICY "Active members can view project members"
ON project_members FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can insert project members"
ON project_members FOR INSERT
WITH CHECK (is_active_member());

CREATE POLICY "Active members can update project members"
ON project_members FOR UPDATE
USING (is_active_member());

CREATE POLICY "Admin or project creator can delete project members"
ON project_members FOR DELETE
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM research_projects rp
    WHERE rp.id = project_members.project_id
    AND rp.created_by = auth.uid()
  )
);

-- Update milestones delete policy
DROP POLICY IF EXISTS "Active members can manage milestones" ON milestones;

CREATE POLICY "Active members can view milestones"
ON milestones FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can insert milestones"
ON milestones FOR INSERT
WITH CHECK (is_active_member());

CREATE POLICY "Active members can update milestones"
ON milestones FOR UPDATE
USING (is_active_member());

CREATE POLICY "Admin or project creator can delete milestones"
ON milestones FOR DELETE
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM research_projects rp
    WHERE rp.id = milestones.project_id
    AND rp.created_by = auth.uid()
  )
);

-- Update checklist_items delete policy
DROP POLICY IF EXISTS "Active members can manage checklist items" ON checklist_items;

CREATE POLICY "Active members can view checklist items"
ON checklist_items FOR SELECT
USING (is_active_member());

CREATE POLICY "Active members can insert checklist items"
ON checklist_items FOR INSERT
WITH CHECK (is_active_member());

CREATE POLICY "Active members can update checklist items"
ON checklist_items FOR UPDATE
USING (is_active_member());

CREATE POLICY "Admin or project creator can delete checklist items"
ON checklist_items FOR DELETE
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM milestones m
    JOIN research_projects rp ON rp.id = m.project_id
    WHERE m.id = checklist_items.milestone_id
    AND rp.created_by = auth.uid()
  )
);
