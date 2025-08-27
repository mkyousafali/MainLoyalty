-- SIMPLE STORAGE POLICY FIX
-- Try disabling RLS on storage.objects completely to test

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Temporarily disable RLS on storage.objects to test uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
