-- =============================================
-- SDC Lab Dashboard - Members Table
-- =============================================

-- ENUM 타입 생성
CREATE TYPE member_position AS ENUM ('professor', 'post-doc', 'phd', 'ms', 'researcher');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'graduated', 'leave');
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time');

-- members 테이블 생성
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    position member_position NOT NULL DEFAULT 'researcher',
    employment_type employment_type NOT NULL DEFAULT 'full-time',
    status member_status NOT NULL DEFAULT 'pending',
    avatar_url TEXT,
    phone TEXT,
    research_interests TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_position ON members(position);
CREATE INDEX idx_members_email ON members(email);

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- members 테이블에 트리거 적용
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자가 조회 가능
CREATE POLICY "Members are viewable by authenticated users"
    ON members FOR SELECT
    TO authenticated
    USING (true);

-- RLS 정책: 본인 정보만 수정 가능
CREATE POLICY "Users can update their own member record"
    ON members FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- RLS 정책: 관리자(professor)만 다른 사용자 상태 변경 가능
CREATE POLICY "Professors can update member status"
    ON members FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM members
            WHERE id = auth.uid() AND position = 'professor'
        )
    );

-- RLS 정책: 신규 가입 시 본인 레코드 생성 가능
CREATE POLICY "Users can insert their own member record"
    ON members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 코멘트 추가
COMMENT ON TABLE members IS '연구실 구성원 정보';
COMMENT ON COLUMN members.id IS 'auth.users와 연결되는 사용자 ID';
COMMENT ON COLUMN members.status IS 'pending: 승인대기, active: 활성, graduated: 졸업, leave: 휴학/퇴직';
COMMENT ON COLUMN members.position IS 'professor: 교수, post-doc: 박사후연구원, phd: 박사과정, ms: 석사과정, researcher: 연구원';
