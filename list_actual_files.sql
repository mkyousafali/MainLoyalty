-- ================================================================
-- LIST ACTUAL FILES IN SOCIAL-ICONS BUCKET
-- ================================================================

SELECT 
  'UPLOADED FILES' as info,
  name as actual_filename,
  bucket_id,
  created_at,
  updated_at,
  owner,
  metadata
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC;

-- Generate actual URLs for your files
SELECT 
  'ACTUAL PUBLIC URLS' as info,
  name as filename,
  CONCAT('https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/social-icons/', name) as public_url
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC;

-- Quick test message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📁 Files listed above are the actual files in your bucket';
    RAISE NOTICE '🌐 Use the "public_url" values to test direct access';
    RAISE NOTICE '📋 Copy a public_url and paste it in a new browser tab';
    RAISE NOTICE '';
    RAISE NOTICE '✅ If the URL shows an image = SUCCESS!';
    RAISE NOTICE '❌ If the URL shows an error = Need more troubleshooting';
END $$;
