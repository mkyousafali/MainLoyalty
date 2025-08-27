-- SUPABASE STORAGE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to check storage setup

-- 1. Check if offer-files bucket exists
SELECT 'Checking offer-files bucket...' as step;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'offer-files';

-- 2. List all storage buckets for reference
SELECT 'All storage buckets:' as step;
SELECT id, name, public FROM storage.buckets;

-- 3. Check storage policies for offer-files bucket
SELECT 'Storage policies for offer-files:' as step;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%offer%';

-- 4. Test if RLS is blocking storage access
SELECT 'RLS status on storage.objects:' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 5. If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-files',
  'offer-files',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  public = true,
  file_size_limit = 10485760;

-- 6. Recreate storage policies (drop existing first)
DROP POLICY IF EXISTS "Public read access for offer files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload offer files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update offer files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete offer files" ON storage.objects;

-- Create fresh policies
CREATE POLICY "Public read access for offer files" ON storage.objects
FOR SELECT 
USING (bucket_id = 'offer-files');

CREATE POLICY "Authenticated users can upload offer files" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update offer files" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete offer files" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

-- 7. Final verification
SELECT 'Final verification - offer-files bucket:' as step;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'offer-files';

SELECT 'SUCCESS: Storage bucket and policies configured!' as status;
