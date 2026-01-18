-- Add is_archived field to research_projects table
-- This allows users to archive completed projects (accepted, in_press, published)
-- so they don't appear in the active dashboard view

ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_research_projects_is_archived
ON research_projects(is_archived);

-- Comment for documentation
COMMENT ON COLUMN research_projects.is_archived IS 'When true, project is archived and hidden from active dashboard view. Typically used for accepted/published projects.';
