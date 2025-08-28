-- ================================================================
-- COPY WORKING BUCKET SETTINGS FROM app-icons to social-icons
-- ================================================================
-- This copies the exact settings from your WORKING app-icons bucket

-- Step 1: Copy exact settings from working app-icons bucket
UPDATE storage.buckets 
SET 
  public = (SELECT public FROM storage.buckets WHERE id = 'app-icons'),
  file_size_limit = (SELECT file_size_limit FROM storage.buckets WHERE id = 'app-icons'),
  allowed_mime_types = (SELECT allowed_mime_types FROM storage.buckets WHERE id = 'app-icons'),
  updated_at = NOW()
WHERE id = 'social-icons';

-- Step 2: Verify the copy worked
SELECT 
  'AFTER COPYING SETTINGS' as status,
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN public = true THEN '✅ NOW PUBLIC'
    ELSE '❌ STILL NOT PUBLIC'
  END as result
FROM storage.buckets 
WHERE id IN ('app-icons', 'social-icons')
ORDER BY id;

-- Step 3: Show a test URL
DO $$
DECLARE
  test_file text;
BEGIN
  SELECT name INTO test_file FROM storage.objects WHERE bucket_id = 'social-icons' LIMIT 1;
  
  IF test_file IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Test this URL now:';
    RAISE NOTICE 'https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/%', test_file;
    RAISE NOTICE '';
    RAISE NOTICE '⏰ Wait 30 seconds then refresh your page!';
  END IF;
END $$;
