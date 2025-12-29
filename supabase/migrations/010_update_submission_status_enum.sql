-- Migration: Update submission_status enum with new values
-- Description: Add new submission status values for detailed tracking

-- Add new enum values
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'under_revision';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'resubmitted';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'under_2nd_review';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'in_press';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'published';

-- Note: The full enum now includes:
-- Under Review Phase:
--   - not_submitted (default)
--   - submitted
--   - under_review
-- Review Result:
--   - minor_revision
--   - major_revision
--   - rejected
-- Revision / Resubmission:
--   - under_revision
--   - resubmitted
--   - under_2nd_review
-- Final:
--   - accepted
--   - in_press
--   - published
