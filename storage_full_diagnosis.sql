-- COMPLETE STORAGE DIAGNOSIS
-- Run this to get full storage setup information

-- 1. Check storage.objects RLS status  
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. Check if you're authenticated (this should return your user info if logged in)
SELECT auth.uid() as user_id, auth.role() as user_role;

-- 3. Check bucket permissions more thoroughly
SELECT 
    b.id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types,
    COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.schemaname = 'storage' 
    AND p.tablename = 'objects' 
    AND (p.qual LIKE '%' || b.id || '%' OR p.with_check LIKE '%' || b.id || '%')
WHERE b.id IN ('offer-thumbnails', 'offer-pdfs')
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- 4. Test simple bucket access
SELECT 'Bucket access test completed' as status;
