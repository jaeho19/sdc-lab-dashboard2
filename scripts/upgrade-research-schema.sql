-- SDC Lab Research Dashboard Upgrade SQL
-- 6단계 연구 진행 시스템으로 업그레이드

-- 1. research_projects 테이블 컬럼 추가
ALTER TABLE research_projects
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'general' CHECK (project_type IN ('advanced', 'general')),
ADD COLUMN IF NOT EXISTS target_journal TEXT,
ADD COLUMN IF NOT EXISTS deadline DATE;

-- 2. project_authors 테이블 생성 (저자 정보 관리)
CREATE TABLE IF NOT EXISTS project_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('first_author', 'corresponding', 'co_author')),
  responsibilities TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_authors_project_id ON project_authors(project_id);

-- RLS 활성화
ALTER TABLE project_authors ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (인증된 사용자 읽기/쓰기 허용)
CREATE POLICY "Allow authenticated read project_authors" ON project_authors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert project_authors" ON project_authors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update project_authors" ON project_authors
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete project_authors" ON project_authors
  FOR DELETE TO authenticated USING (true);

-- 3. 기본 6단계 마일스톤 생성 함수
CREATE OR REPLACE FUNCTION create_default_milestones(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_milestone_id UUID;
BEGIN
  -- 1. 문헌조사 (15%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'literature_review', 15, true, 1)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '주요 키워드 검색 (Google Scholar, DBpia)', 1),
  (v_milestone_id, '관련 핵심 논문 10편 선정', 2),
  (v_milestone_id, '기존 연구 한계점 도출', 3),
  (v_milestone_id, '연구 차별성 확보', 4);

  -- 2. 방법론 설계 (15%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'methodology', 15, false, 2)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '연구 가설 설정', 1),
  (v_milestone_id, '변수 정의 및 측정 방법 결정', 2),
  (v_milestone_id, '분석 모형(알고리즘) 선정', 3),
  (v_milestone_id, '데이터 확보 계획 수립', 4);

  -- 3. 데이터 수집 (15%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'data_collection', 15, false, 3)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '공공데이터 포털 데이터 확보', 1),
  (v_milestone_id, '데이터 전처리 및 정제', 2),
  (v_milestone_id, '결측치 및 이상치 처리', 3),
  (v_milestone_id, '데이터 구조화 완료', 4);

  -- 4. 분석 (25%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'analysis', 25, false, 4)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '기초 통계 분석', 1),
  (v_milestone_id, '시각화 수행', 2),
  (v_milestone_id, '가설 검증 / 모델 학습', 3),
  (v_milestone_id, '분석 결과 해석', 4);

  -- 5. 초고 작성 (20%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'draft_writing', 20, false, 5)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '서론 및 이론적 배경 작성', 1),
  (v_milestone_id, '연구 방법 기술', 2),
  (v_milestone_id, '분석 결과 정리', 3),
  (v_milestone_id, '결론 및 시사점 도출', 4);

  -- 6. 투고 (10%)
  INSERT INTO milestones (project_id, stage, weight, is_current, sort_order)
  VALUES (p_project_id, 'submission', 10, false, 6)
  RETURNING id INTO v_milestone_id;

  INSERT INTO checklist_items (milestone_id, content, sort_order) VALUES
  (v_milestone_id, '타겟 저널 포맷팅 (Author Guidelines)', 1),
  (v_milestone_id, 'Cover Letter 작성', 2),
  (v_milestone_id, 'Manuscript 제출', 3),
  (v_milestone_id, '심사료 납부', 4);
END;
$$ LANGUAGE plpgsql;

-- 4. 진행률 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_progress NUMERIC := 0;
  v_milestone RECORD;
  v_checklist_total INTEGER;
  v_checklist_completed INTEGER;
  v_milestone_progress NUMERIC;
BEGIN
  FOR v_milestone IN
    SELECT m.id, m.weight
    FROM milestones m
    WHERE m.project_id = p_project_id
  LOOP
    SELECT COUNT(*), COALESCE(SUM(CASE WHEN is_completed THEN 1 ELSE 0 END), 0)
    INTO v_checklist_total, v_checklist_completed
    FROM checklist_items
    WHERE milestone_id = v_milestone.id;

    IF v_checklist_total > 0 THEN
      v_milestone_progress := (v_checklist_completed::NUMERIC / v_checklist_total) * v_milestone.weight;
      v_total_progress := v_total_progress + v_milestone_progress;
    END IF;
  END LOOP;

  RETURN ROUND(v_total_progress, 1);
END;
$$ LANGUAGE plpgsql;

-- 5. 체크리스트 업데이트 시 진행률 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_project_progress_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_new_progress NUMERIC;
BEGIN
  -- milestone_id로 project_id 조회
  SELECT project_id INTO v_project_id
  FROM milestones
  WHERE id = COALESCE(NEW.milestone_id, OLD.milestone_id);

  IF v_project_id IS NOT NULL THEN
    v_new_progress := calculate_project_progress(v_project_id);

    UPDATE research_projects
    SET overall_progress = v_new_progress,
        updated_at = NOW()
    WHERE id = v_project_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_progress ON checklist_items;

CREATE TRIGGER trigger_update_progress
AFTER INSERT OR UPDATE OR DELETE ON checklist_items
FOR EACH ROW
EXECUTE FUNCTION update_project_progress_trigger();

-- 6. 현재 단계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_current_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_milestone_id UUID;
  v_all_completed BOOLEAN;
BEGIN
  -- milestone_id로 project_id 조회
  SELECT project_id INTO v_project_id
  FROM milestones
  WHERE id = NEW.milestone_id;

  -- 현재 마일스톤의 모든 체크리스트가 완료되었는지 확인
  SELECT NOT EXISTS (
    SELECT 1 FROM checklist_items
    WHERE milestone_id = NEW.milestone_id AND NOT is_completed
  ) INTO v_all_completed;

  IF v_all_completed AND NEW.is_completed THEN
    -- 현재 마일스톤 완료 처리
    UPDATE milestones
    SET completed_at = NOW(), is_current = false
    WHERE id = NEW.milestone_id AND is_current = true;

    -- 다음 마일스톤을 현재로 설정
    UPDATE milestones
    SET is_current = true
    WHERE id = (
      SELECT id FROM milestones
      WHERE project_id = v_project_id
        AND completed_at IS NULL
        AND id != NEW.milestone_id
      ORDER BY sort_order
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_current_milestone ON checklist_items;

CREATE TRIGGER trigger_update_current_milestone
AFTER UPDATE OF is_completed ON checklist_items
FOR EACH ROW
WHEN (NEW.is_completed = true AND OLD.is_completed = false)
EXECUTE FUNCTION update_current_milestone();
