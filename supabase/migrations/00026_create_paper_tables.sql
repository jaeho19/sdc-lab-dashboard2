-- =============================================
-- SDC Lab Dashboard - Paper Auto-Update Tables
-- 연구분야별 최신 논문 자동 검색 시스템
-- =============================================

-- pg_trgm 확장 (논문 제목 퍼지 검색)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- 1. research_fields — 연구분야 키워드 관리
-- =============================================
CREATE TABLE research_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  search_queries JSONB NOT NULL DEFAULT '[]',
  map_node_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE research_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read research_fields"
  ON research_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage research_fields"
  ON research_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

CREATE INDEX idx_research_fields_active ON research_fields (is_active);
CREATE INDEX idx_research_fields_map_node ON research_fields (map_node_id);

CREATE TRIGGER update_research_fields_updated_at
  BEFORE UPDATE ON research_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. papers — 논문 메타데이터
-- =============================================
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]',
  abstract TEXT,
  doi TEXT UNIQUE,
  url TEXT,
  journal TEXT,
  publication_date DATE,
  publication_year INT,
  citation_count INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  external_id TEXT,
  is_lab_member BOOLEAN NOT NULL DEFAULT false,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read visible papers"
  ON papers FOR SELECT
  TO authenticated
  USING (is_hidden = false);

CREATE POLICY "Admins can manage papers"
  ON papers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

CREATE INDEX idx_papers_doi ON papers (doi);
CREATE INDEX idx_papers_pub_date ON papers (publication_date DESC);
CREATE INDEX idx_papers_source ON papers (source);
CREATE INDEX idx_papers_member ON papers (member_id) WHERE member_id IS NOT NULL;
CREATE INDEX idx_papers_lab_member ON papers (is_lab_member) WHERE is_lab_member = true;
CREATE INDEX idx_papers_title_trgm ON papers USING gin (title gin_trgm_ops);

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. paper_field_links — 논문↔연구분야 N:M 매핑
-- =============================================
CREATE TABLE paper_field_links (
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES research_fields(id) ON DELETE CASCADE,
  relevance FLOAT NOT NULL DEFAULT 0.5,
  PRIMARY KEY (paper_id, field_id)
);

ALTER TABLE paper_field_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read paper_field_links"
  ON paper_field_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage paper_field_links"
  ON paper_field_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

-- =============================================
-- 4. paper_fetch_logs — 검색 실행 로그
-- =============================================
CREATE TABLE paper_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  fields_searched INT NOT NULL DEFAULT 0,
  papers_found INT NOT NULL DEFAULT 0,
  papers_inserted INT NOT NULL DEFAULT 0,
  papers_skipped INT NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  details JSONB DEFAULT '{}'
);

ALTER TABLE paper_fetch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read paper_fetch_logs"
  ON paper_fetch_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.position = 'professor'
    )
  );

CREATE POLICY "Service role can manage paper_fetch_logs"
  ON paper_fetch_logs FOR ALL
  TO service_role
  USING (true);

-- =============================================
-- 5. Seed Data — 12 연구분야 키워드
-- =============================================
INSERT INTO research_fields (name, name_en, map_node_id, search_queries) VALUES
(
  '녹지 접근성',
  'Green Space Accessibility',
  'k_녹지',
  '[{"api":"semantic_scholar","query":"green space accessibility equity urban park"},{"api":"openalex","query":"green space accessibility equity urban park"}]'::jsonb
),
(
  '보행환경',
  'Walkability & Pedestrian Environment',
  'k_보행',
  '[{"api":"semantic_scholar","query":"pedestrian environment walkability street view assessment"},{"api":"openalex","query":"walkability pedestrian environment streetscape"}]'::jsonb
),
(
  '형평성',
  'Spatial Equity & Environmental Justice',
  'k_형평성',
  '[{"api":"semantic_scholar","query":"spatial equity environmental justice park access disparity"},{"api":"openalex","query":"environmental justice spatial equity park accessibility"}]'::jsonb
),
(
  '수용성',
  'Social Acceptance of Renewable Energy',
  'k_수용성',
  '[{"api":"semantic_scholar","query":"social acceptance renewable energy agrivoltaics rural community"},{"api":"openalex","query":"social acceptance agrivoltaics renewable energy rural"}]'::jsonb
),
(
  '취약성',
  'Agricultural Vulnerability',
  'k_취약성',
  '[{"api":"semantic_scholar","query":"agricultural vulnerability climate change land use satellite"},{"api":"openalex","query":"agricultural vulnerability remote sensing climate change"}]'::jsonb
),
(
  '공동체',
  'Rural Community & Participation',
  'k_공동체',
  '[{"api":"semantic_scholar","query":"rural community participation governance restructuring"},{"api":"openalex","query":"rural community participation governance"}]'::jsonb
),
(
  '에너지 전환',
  'Energy Transition',
  'k_에너지',
  '[{"api":"semantic_scholar","query":"energy transition rural renewable agrivoltaic conflict"},{"api":"openalex","query":"energy transition rural renewable agrivoltaic"}]'::jsonb
),
(
  '정책 수용성',
  'Policy Acceptance & Digital Persona',
  'k_정책',
  '[{"api":"semantic_scholar","query":"policy acceptance LLM digital persona simulation"},{"api":"openalex","query":"policy acceptance simulation digital persona"}]'::jsonb
),
(
  'AI/딥러닝 도시계획',
  'AI in Urban Planning',
  'k_ai',
  '[{"api":"semantic_scholar","query":"deep learning urban planning computer vision landscape analysis"},{"api":"openalex","query":"artificial intelligence urban planning computer vision landscape"}]'::jsonb
),
(
  '비전언어모델',
  'Vision-Language Models for Spatial Analysis',
  'k_vlm',
  '[{"api":"semantic_scholar","query":"vision language model spatial analysis urban streetscape"},{"api":"openalex","query":"vision language model urban landscape spatial"}]'::jsonb
),
(
  '원격탐사',
  'Remote Sensing for Land Use',
  'k_rs',
  '[{"api":"semantic_scholar","query":"remote sensing land use change satellite imagery NDVI"},{"api":"openalex","query":"remote sensing land use change NDVI satellite"}]'::jsonb
),
(
  '기후정의',
  'Climate Justice',
  'k_기후',
  '[{"api":"semantic_scholar","query":"climate justice urban green infrastructure equity vulnerability"},{"api":"openalex","query":"climate justice green infrastructure equity"}]'::jsonb
);

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE research_fields IS '연구분야 키워드 관리 — 논문 자동 검색 쿼리 포함';
COMMENT ON TABLE papers IS '자동 검색된 논문 메타데이터';
COMMENT ON TABLE paper_field_links IS '논문↔연구분야 N:M 매핑';
COMMENT ON TABLE paper_fetch_logs IS '논문 검색 실행 로그';
