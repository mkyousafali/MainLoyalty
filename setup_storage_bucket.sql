-- ================================================================
-- STORAGE BUCKET SETUP FOR GUEST SOCIAL ICONS
-- ================================================================
-- IMPORTANT: Run this after creating the bucket through the UI
-- This sets up the RLS policies that Supabase allows users to modify

-- Note: The storage.objects table policies need to be set up through
-- the Supabase Dashboard interface, not through SQL for most users

-- ================================================================
-- MANUAL SETUP INSTRUCTIONS (REQUIRED)
-- ================================================================

-- STEP 1: Create the storage bucket through Supabase Dashboard
-- 1. Go to Supabase Dashboard -> Storage  
-- 2. Click "New Bucket"
-- 3. Bucket name: social-icons
-- 4. Public bucket: YES (very important!)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/png,image/jpeg,image/jpg,image/gif,image/webp

-- STEP 2: Configure bucket policies through the Dashboard
-- 1. After creating the bucket, click on the bucket name
-- 2. Go to "Policies" tab
-- 3. Create these policies:

-- Policy 1: Allow public uploads
-- Name: "Allow public uploads to social-icons"
-- Action: INSERT
-- Target roles: public, anon, authenticated
-- USING expression: bucket_id = 'social-icons'

-- Policy 2: Allow public reads  
-- Name: "Allow public reads from social-icons"
-- Action: SELECT
-- Target roles: public
-- USING expression: bucket_id = 'social-icons'

-- Policy 3: Allow authenticated updates
-- Name: "Allow authenticated updates to social-icons"  
-- Action: UPDATE
-- Target roles: authenticated
-- USING expression: bucket_id = 'social-icons'

-- Policy 4: Allow authenticated deletes
-- Name: "Allow authenticated deletes from social-icons"
-- Action: DELETE  
-- Target roles: authenticated
-- USING expression: bucket_id = 'social-icons'

-- ================================================================
-- VERIFICATION QUERY (Run this to check if bucket exists)
-- ================================================================

SELECT 
  'Checking if social-icons bucket exists...' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = 'social-icons'
    ) 
    THEN '✅ Bucket exists' 
    ELSE '❌ Bucket not found - please create it through Dashboard' 
  END as bucket_status;

-- ================================================================
-- ALTERNATIVE: If you have admin access, uncomment below
-- ================================================================

-- Only uncomment these if you have full admin access to storage tables
-- Otherwise, use the Dashboard method above

/*
-- Enable RLS if you have permissions
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies if you have owner permissions
-- CREATE POLICY "social_icons_upload" ON storage.objects 
--   FOR INSERT TO public WITH CHECK (bucket_id = 'social-icons');
-- CREATE POLICY "social_icons_read" ON storage.objects 
--   FOR SELECT TO public USING (bucket_id = 'social-icons');
-- CREATE POLICY "social_icons_update" ON storage.objects 
--   FOR UPDATE TO authenticated USING (bucket_id = 'social-icons');
-- CREATE POLICY "social_icons_delete" ON storage.objects 
--   FOR DELETE TO authenticated USING (bucket_id = 'social-icons');
*/

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📦 STORAGE BUCKET SETUP GUIDE';
    RAISE NOTICE '';
    RAISE NOTICE '❗ IMPORTANT: Manual setup required due to permissions';
    RAISE NOTICE '';
    RAISE NOTICE '� Steps to complete setup:';
    RAISE NOTICE '1. Go to Supabase Dashboard -> Storage';
    RAISE NOTICE '2. Create bucket: social-icons (public: YES)';
    RAISE NOTICE '3. Set file size limit: 5MB';
    RAISE NOTICE '4. Allowed types: image/png,image/jpeg,image/jpg,image/gif,image/webp';
    RAISE NOTICE '5. Configure policies through Dashboard UI';
    RAISE NOTICE '';
    RAISE NOTICE '✅ After manual setup, uploads will work!';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Documentation: https://supabase.com/docs/guides/storage';
END $$;
