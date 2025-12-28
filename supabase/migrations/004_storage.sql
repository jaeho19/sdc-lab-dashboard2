-- SDC Lab Dashboard - Storage Buckets Setup
-- Supabase Dashboard > Storage에서 실행하거나 SQL Editor에서 실행

-- ============================================
-- Storage Buckets 생성
-- ============================================

-- 프로필 이미지 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 프로젝트 파일 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects',
  'projects',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'text/markdown',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 멘토링 첨부파일 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mentoring',
  'mentoring',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'text/markdown',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Profiles 버킷 정책 (공개 읽기, 본인만 업로드)
CREATE POLICY "Public profiles are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Projects 버킷 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'projects' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'projects' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'projects' AND
  auth.role() = 'authenticated'
);

-- Mentoring 버킷 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can view mentoring files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mentoring' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload mentoring files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mentoring' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete mentoring files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mentoring' AND
  auth.role() = 'authenticated'
);
