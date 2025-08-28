-- ================================================================
-- REMOVE SUPABASE STORAGE BUCKET COMPLETELY
-- ================================================================

-- Delete ALL files from social-icons bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'social-icons';

-- Delete the bucket itself (optional)
DELETE FROM storage.buckets 
WHERE id = 'social-icons';

-- Update database to remove custom icon references
UPDATE social_links 
SET use_custom_icon = false, 
    custom_icon_url = null 
WHERE use_custom_icon = true;

-- Verify cleanup
SELECT 'STORAGE CLEANUP' as status, COUNT(*) as remaining_files
FROM storage.objects 
WHERE bucket_id = 'social-icons';

SELECT 'DB CLEANUP' as status, COUNT(*) as custom_icon_records
FROM social_links 
WHERE use_custom_icon = true;
