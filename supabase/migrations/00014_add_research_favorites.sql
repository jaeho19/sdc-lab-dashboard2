-- 연구 프로젝트 즐겨찾기 테이블 생성
CREATE TABLE IF NOT EXISTS research_project_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- RLS 활성화
ALTER TABLE research_project_favorites ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 자신의 즐겨찾기 관리 가능
CREATE POLICY "Users can view their own favorites"
ON research_project_favorites FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own favorites"
ON research_project_favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own favorites"
ON research_project_favorites FOR DELETE
USING (true);

-- 인덱스 추가
CREATE INDEX idx_favorites_user_id ON research_project_favorites(user_id);
CREATE INDEX idx_favorites_project_id ON research_project_favorites(project_id);
