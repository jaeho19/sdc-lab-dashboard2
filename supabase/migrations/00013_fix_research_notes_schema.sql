-- ================================
-- research_notes 테이블 스키마 수정
-- stage 컬럼 추가, milestone_id nullable로 변경
-- ================================

-- 1. milestone_id를 nullable로 변경
ALTER TABLE research_notes
ALTER COLUMN milestone_id DROP NOT NULL;

-- 2. stage 컬럼 추가 (MilestoneStage 타입)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_notes' AND column_name = 'stage'
  ) THEN
    ALTER TABLE research_notes
    ADD COLUMN stage TEXT NOT NULL DEFAULT 'literature_review';
  END IF;
END $$;

-- 3. stage 컬럼에 CHECK 제약조건 추가 (유효한 값만 허용)
DO $$ BEGIN
  ALTER TABLE research_notes
  ADD CONSTRAINT research_notes_stage_check
  CHECK (stage IN (
    'literature_review',
    'methodology',
    'data_collection',
    'analysis',
    'draft_writing',
    'submission',
    'review_revision',
    'publication'
  ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. 기존 데이터가 있다면 milestone의 stage로 업데이트
UPDATE research_notes rn
SET stage = m.stage
FROM milestones m
WHERE rn.milestone_id = m.id
  AND rn.stage = 'literature_review';

-- 5. stage 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_research_notes_stage ON research_notes(stage);

-- 확인 메시지
DO $$ BEGIN
  RAISE NOTICE 'research_notes 테이블 스키마 수정 완료!';
  RAISE NOTICE '- milestone_id: nullable로 변경됨';
  RAISE NOTICE '- stage: 컬럼 추가됨';
END $$;
