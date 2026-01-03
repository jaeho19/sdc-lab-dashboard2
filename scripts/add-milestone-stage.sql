-- Milestones 테이블에 stage 컬럼 추가
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. stage 컬럼 추가 (이미 존재하면 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'milestones' AND column_name = 'stage'
    ) THEN
        ALTER TABLE milestones
        ADD COLUMN stage VARCHAR(30) CHECK (stage IN (
            'literature_review', 'methodology', 'data_collection', 'analysis',
            'draft_writing', 'submission', 'review_revision', 'publication'
        ));
    END IF;
END $$;

-- 2. 기존 마일스톤에 stage 값 설정 (title 기반으로 매핑)
UPDATE milestones SET stage = 'literature_review' WHERE title ILIKE '%문헌%' OR title ILIKE '%literature%';
UPDATE milestones SET stage = 'methodology' WHERE title ILIKE '%방법론%' OR title ILIKE '%method%';
UPDATE milestones SET stage = 'data_collection' WHERE title ILIKE '%데이터%' OR title ILIKE '%수집%' OR title ILIKE '%data%';
UPDATE milestones SET stage = 'analysis' WHERE title ILIKE '%분석%' OR title ILIKE '%analysis%';
UPDATE milestones SET stage = 'draft_writing' WHERE title ILIKE '%초고%' OR title ILIKE '%작성%' OR title ILIKE '%draft%' OR title ILIKE '%writing%';
UPDATE milestones SET stage = 'submission' WHERE title ILIKE '%투고%' OR title ILIKE '%submit%';
UPDATE milestones SET stage = 'review_revision' WHERE title ILIKE '%수정%' OR title ILIKE '%심사%' OR title ILIKE '%revision%' OR title ILIKE '%review%';
UPDATE milestones SET stage = 'publication' WHERE title ILIKE '%출판%' OR title ILIKE '%publish%';

-- 3. 아직 stage가 없는 마일스톤에 기본값 설정 (order_index 기반)
UPDATE milestones
SET stage = CASE
    WHEN order_index = 0 THEN 'literature_review'
    WHEN order_index = 1 THEN 'methodology'
    WHEN order_index = 2 THEN 'data_collection'
    WHEN order_index = 3 THEN 'analysis'
    WHEN order_index = 4 THEN 'draft_writing'
    WHEN order_index = 5 THEN 'submission'
    WHEN order_index = 6 THEN 'review_revision'
    WHEN order_index = 7 THEN 'publication'
    ELSE 'literature_review'
END
WHERE stage IS NULL;

-- 4. 확인
SELECT id, title, stage, order_index FROM milestones ORDER BY order_index LIMIT 20;
