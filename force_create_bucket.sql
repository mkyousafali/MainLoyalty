-- FORCE CREATE OFFER-FILES BUCKET
-- Run this in Supabase SQL Editor for project: sfydwpimwnxocrgpiour

-- First, check what buckets actually exist
SELECT 'Current buckets:' as status;
SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at;

-- Force delete and recreate the bucket (if it exists)
DELETE FROM storage.objects WHERE bucket_id = 'offer-files';
DELETE FROM storage.buckets WHERE id = 'offer-files';

-- Create the bucket fresh
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
) VALUES (
  'offer-files',
  'offer-files', 
  true,
  10485760,
  '{image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf}',
  NOW(),
  NOW()
);

-- Create storage policies
CREATE POLICY "offer_files_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'offer-files');

CREATE POLICY "offer_files_auth_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "offer_files_auth_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "offer_files_auth_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

-- Verify the bucket was created
SELECT 'Verification - Bucket created:' as status;
SELECT 
  id,
  name, 
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'offer-files';

-- Check policies
SELECT 'Verification - Policies created:' as status;
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%offer_files%';

SELECT 'SUCCESS: Bucket force-created!' as final_status;
