-- =============================================
-- SDC Lab Dashboard - Storage Buckets Setup
-- =============================================

-- =============================================
-- 버킷 생성
-- =============================================

-- profiles 버킷 (프로필 이미지)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles',
    'profiles',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- projects 버킷 (프로젝트 파일)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects',
    FALSE,
    10485760, -- 10MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'text/markdown',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- mentoring 버킷 (멘토링 첨부파일)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mentoring',
    'mentoring',
    FALSE,
    10485760, -- 10MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'text/markdown',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage RLS 정책
-- =============================================

-- profiles 버킷 정책
CREATE POLICY "Profile images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile image"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can update their own profile image"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can delete their own profile image"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- projects 버킷 정책
CREATE POLICY "Project files are accessible to authenticated users"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'projects');

CREATE POLICY "Authenticated users can upload project files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'projects');

CREATE POLICY "Uploaders and professors can delete project files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'projects'
        AND (
            (storage.foldername(name))[1] = auth.uid()::TEXT
            OR EXISTS (
                SELECT 1 FROM members
                WHERE id = auth.uid() AND position = 'professor'
            )
        )
    );

-- mentoring 버킷 정책
CREATE POLICY "Mentoring files are accessible to authenticated users"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'mentoring');

CREATE POLICY "Authenticated users can upload mentoring files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'mentoring');

CREATE POLICY "Uploaders and professors can delete mentoring files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'mentoring'
        AND (
            (storage.foldername(name))[1] = auth.uid()::TEXT
            OR EXISTS (
                SELECT 1 FROM members
                WHERE id = auth.uid() AND position = 'professor'
            )
        )
    );

-- 코멘트 추가
COMMENT ON TABLE storage.buckets IS 'Supabase Storage 버킷';
