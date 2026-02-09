-- Migration: Add previous_content column to research_meetings
-- Feature: meeting-notes-3col-form
-- Description: 이전 미팅 주요 내용을 저장하는 컬럼 추가

ALTER TABLE research_meetings
  ADD COLUMN IF NOT EXISTS previous_content TEXT;

COMMENT ON COLUMN research_meetings.previous_content IS '이전 미팅 주요 내용 요약';
