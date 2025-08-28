-- ================================================================
-- FORCE COMPLETE BUCKET RESET AND PUBLIC ACCESS
-- ================================================================
-- This will completely reset the bucket configuration

-- Step 1: Force update bucket with all settings
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = NULL,
  updated_at = NOW()
WHERE id = 'social-icons';

-- Step 2: Refresh the bucket metadata
UPDATE storage.objects 
SET updated_at = NOW()
WHERE bucket_id = 'social-icons';

-- Step 3: Verify everything is correct
SELECT 
  'FINAL VERIFICATION' as status,
  id,
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'social-icons';

-- Step 4: List files with metadata refresh
SELECT 
  'FILES AFTER REFRESH' as status,
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC;

-- Step 5: Try alternative URL format test
DO $$
DECLARE
  file_name text;
  alt_url text;
BEGIN
  -- Get the first file
  SELECT name INTO file_name FROM storage.objects WHERE bucket_id = 'social-icons' LIMIT 1;
  
  IF file_name IS NOT NULL THEN
    -- Show different URL formats to try
    RAISE NOTICE '';
    RAISE NOTICE '🔄 TRYING DIFFERENT URL FORMATS:';
    RAISE NOTICE '';
    RAISE NOTICE 'Format 1 (Standard): https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/%', file_name;
    RAISE NOTICE 'Format 2 (Alternative): https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/social-icons/%', file_name;
    RAISE NOTICE '';
    RAISE NOTICE '⏰ Wait 30-60 seconds after running this, then try both URLs';
    RAISE NOTICE '🔄 Sometimes Supabase needs time to propagate bucket changes';
  ELSE
    RAISE NOTICE '❌ No files found in bucket';
  END IF;
END $$;
