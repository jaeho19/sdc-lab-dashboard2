-- Add missing enum values for project_category and project_status
-- Fix: Frontend form values (individual, grant, submitting, accepted, published)
-- were not present in DB enums, causing INSERT failures

ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'individual';
ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'grant';

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'submitting';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'published';
