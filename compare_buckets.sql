-- ================================================================
-- CHECK BUCKET CONFIGURATIONS - Compare working vs broken
-- ================================================================
-- This will help us see the difference between app-icons (working) and social-icons (broken)

-- Check both buckets side by side
SELECT 
  'BUCKET COMPARISON' as status,
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at,
  CASE 
    WHEN public = true THEN '✅ PUBLIC'
    ELSE '❌ NOT PUBLIC'
  END as public_status
FROM storage.buckets 
WHERE id IN ('app-icons', 'social-icons')
ORDER BY id;

-- Show files from both buckets
SELECT 
  'FILES IN app-icons (WORKING)' as status,
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'app-icons'
ORDER BY created_at DESC
LIMIT 3;

SELECT 
  'FILES IN social-icons (BROKEN)' as status,
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC
LIMIT 3;

-- Test URLs for both buckets (just show the patterns)
DO $$
DECLARE
  app_icon_file text;
  social_icon_file text;
BEGIN
  -- Get sample files
  SELECT name INTO app_icon_file FROM storage.objects WHERE bucket_id = 'app-icons' LIMIT 1;
  SELECT name INTO social_icon_file FROM storage.objects WHERE bucket_id = 'social-icons' LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 URL COMPARISON:';
  RAISE NOTICE '';
  
  IF app_icon_file IS NOT NULL THEN
    RAISE NOTICE '✅ WORKING app-icons URL: https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/app-icons/%', app_icon_file;
  END IF;
  
  IF social_icon_file IS NOT NULL THEN
    RAISE NOTICE '❌ BROKEN social-icons URL: https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/%', social_icon_file;
  END IF;
  
  RAISE NOTICE '';
END $$;
