-- ================================================================
-- MAKE SOCIAL-ICONS BUCKET PUBLIC
-- ================================================================
-- This will make the bucket public so URLs work without authentication

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true
WHERE id = 'social-icons';

-- Verify the change
SELECT 
  'BUCKET STATUS AFTER UPDATE' as status,
  id,
  name,
  public as is_now_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'social-icons';

-- Success message
DO $$
DECLARE
  bucket_public boolean;
BEGIN
  SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'social-icons';
  
  IF bucket_public THEN
    RAISE NOTICE '✅ SUCCESS: Bucket is now PUBLIC!';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Your icons are now accessible at:';
    RAISE NOTICE 'https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/[filename]';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Icons should now display in your app!';
  ELSE
    RAISE NOTICE '❌ FAILED: Bucket is still not public';
    RAISE NOTICE '💡 Try using the Supabase Dashboard method instead';
  END IF;
END $$;
