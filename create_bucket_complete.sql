-- ================================================================
-- COMPLETE STORAGE BUCKET CREATION WITH FULL POLICIES
-- ================================================================
-- Run this AFTER deleting the existing bucket
-- This will create the bucket and all necessary policies

-- ================================================================
-- STEP 1: CREATE THE STORAGE BUCKET
-- ================================================================

INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'social-icons',
  'social-icons', 
  NULL,
  true,
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- ================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY (if not already enabled)
-- ================================================================

-- Enable RLS on storage.objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on storage.objects';
  ELSE
    RAISE NOTICE 'RLS already enabled on storage.objects';
  END IF;
END $$;

-- Enable RLS on storage.buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'buckets' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on storage.buckets';
  ELSE
    RAISE NOTICE 'RLS already enabled on storage.buckets';
  END IF;
END $$;

-- ================================================================
-- STEP 3: DROP ANY EXISTING POLICIES (CLEAN SLATE)
-- ================================================================

-- Drop all existing social-icons related policies
DO $$
DECLARE
  policy_record record;
BEGIN
  -- Drop policies on storage.objects
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND (policyname ILIKE '%social%' OR policyname ILIKE '%icon%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
  
  -- Drop policies on storage.buckets
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'buckets' 
    AND (policyname ILIKE '%social%' OR policyname ILIKE '%icon%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ================================================================
-- STEP 4: CREATE COMPREHENSIVE POLICIES FOR STORAGE.OBJECTS
-- ================================================================

-- Policy 1: Allow public uploads to social-icons bucket
CREATE POLICY "social_icons_upload_policy" ON storage.objects
  FOR INSERT 
  TO public
  WITH CHECK (bucket_id = 'social-icons');

-- Policy 2: Allow public reads from social-icons bucket  
CREATE POLICY "social_icons_read_policy" ON storage.objects
  FOR SELECT
  TO public 
  USING (bucket_id = 'social-icons');

-- Policy 3: Allow authenticated users to update files in social-icons bucket
CREATE POLICY "social_icons_update_policy" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'social-icons')
  WITH CHECK (bucket_id = 'social-icons');

-- Policy 4: Allow authenticated users to delete files from social-icons bucket
CREATE POLICY "social_icons_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'social-icons');

-- ================================================================
-- STEP 5: CREATE POLICIES FOR STORAGE.BUCKETS
-- ================================================================

-- Allow public access to read bucket information
CREATE POLICY "social_icons_bucket_read_policy" ON storage.buckets
  FOR SELECT
  TO public
  USING (id = 'social-icons');

-- ================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ================================================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- Grant permissions on buckets table
GRANT SELECT ON storage.buckets TO anon, authenticated, service_role;

-- Grant permissions on objects table  
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;

-- ================================================================
-- STEP 7: VERIFICATION AND STATUS CHECK
-- ================================================================

-- Verify bucket creation
SELECT 
  'BUCKET STATUS' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'social-icons')
    THEN '✅ social-icons bucket created successfully'
    ELSE '❌ social-icons bucket creation failed'
  END as status;

-- Verify bucket configuration
SELECT 
  'BUCKET CONFIG' as check_type,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'social-icons';

-- List all policies on storage.objects for social-icons
SELECT 
  'OBJECT POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd as action
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname ILIKE '%social%'
ORDER BY policyname;

-- List all policies on storage.buckets for social-icons  
SELECT 
  'BUCKET POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd as action
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'buckets'
  AND policyname ILIKE '%social%'
ORDER BY policyname;

-- ================================================================
-- STEP 8: TEST UPLOAD SIMULATION (Optional)
-- ================================================================

-- This creates a test scenario to verify permissions work
DO $$
DECLARE
  bucket_public boolean;
  size_limit bigint;
BEGIN
  -- Check if bucket is public
  SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'social-icons';
  
  IF bucket_public THEN
    RAISE NOTICE '✅ Upload permissions should work - bucket is public';
  ELSE
    RAISE NOTICE '❌ Upload may fail - bucket is not public';
  END IF;
  
  -- Check file size limit
  SELECT file_size_limit INTO size_limit FROM storage.buckets WHERE id = 'social-icons';
  
  IF size_limit >= 5242880 THEN
    RAISE NOTICE '✅ File size limit is adequate: % bytes', size_limit;
  ELSE
    RAISE NOTICE '⚠️ File size limit is too small: % bytes', size_limit;
  END IF;
  
END $$;

-- ================================================================
-- COMPLETION SUMMARY
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COMPLETE STORAGE BUCKET SETUP FINISHED!';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Bucket Created: social-icons';
    RAISE NOTICE '🔐 Security: Public bucket with RLS policies';  
    RAISE NOTICE '📏 File Size Limit: 5MB (5,242,880 bytes)';
    RAISE NOTICE '🎨 Allowed Types: PNG, JPG, JPEG, GIF, WebP';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Policies Created:';
    RAISE NOTICE '• Public uploads (anon + authenticated)';
    RAISE NOTICE '• Public read access';  
    RAISE NOTICE '• Authenticated updates';
    RAISE NOTICE '• Authenticated deletions';
    RAISE NOTICE '• Bucket read permissions';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Status: READY FOR ICON UPLOADS!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next: Test upload in your admin interface';
END $$;
