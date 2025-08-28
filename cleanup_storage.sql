-- ================================================================
-- COMPLETE SOCIAL-ICONS STORAGE CLEANUP
-- ================================================================

-- Delete ALL files from social-icons bucket (complete cleanup)
DELETE FROM storage.objects 
WHERE bucket_id = 'social-icons';

-- Verify cleanup completed
SELECT 
  'CLEANUP VERIFICATION' as status,
  COUNT(*) as remaining_files
FROM storage.objects 
WHERE bucket_id = 'social-icons';

-- Show what database records will need new icons
SELECT 
  'RECORDS NEEDING ICONS' as status,
  id,
  name,
  custom_icon_url as old_filename,
  updated_at
FROM social_links 
WHERE use_custom_icon = true 
ORDER BY updated_at DESC;
