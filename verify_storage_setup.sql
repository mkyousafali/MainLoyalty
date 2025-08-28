-- ================================================================
-- VERIFY STORAGE BUCKET PUBLIC ACCESS
-- ================================================================
-- Run this to check if your bucket is properly configured for public access

-- Check bucket configuration
SELECT 
  'BUCKET CONFIG' as check_type,
  id as bucket_name,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'social-icons';

-- Check if there are files in the bucket
SELECT 
  'UPLOADED FILES' as check_type,
  name as file_name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC
LIMIT 10;

-- Check bucket policies
SELECT 
  'BUCKET POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'buckets'
  AND (policyname ILIKE '%social%' OR qual ILIKE '%social-icons%')
ORDER BY policyname;

-- Check object policies  
SELECT 
  'OBJECT POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname ILIKE '%social%' OR qual ILIKE '%social-icons%')
ORDER BY policyname;

-- Test public URL format (this shows what the URL structure should be)
DO $$
DECLARE
  bucket_public boolean;
  sample_url text;
BEGIN
  -- Check if bucket is public
  SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'social-icons';
  
  IF bucket_public THEN
    -- Show expected URL format for public bucket
    sample_url := 'https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/filename.png';
    RAISE NOTICE '✅ Bucket is PUBLIC';
    RAISE NOTICE '📋 Expected URL format: %', sample_url;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Your icons should be accessible at:';
    RAISE NOTICE 'https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/[filename]';
  ELSE
    RAISE NOTICE '❌ Bucket is NOT PUBLIC';
    RAISE NOTICE '⚠️  Icons will not display without authentication';
  END IF;
END $$;
