-- STORAGE POLICIES VERIFICATION
-- Run this to check if storage policies are set up correctly

-- Check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check existing policies on storage.objects
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname IN ('Public Thumbnails', 'Public PDFs', 'Auth Upload Thumbnails', 'Auth Upload PDFs');

-- If policies are missing, you may need to re-run the storage policies section of simple_offers_schema.sql
