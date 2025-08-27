-- SUPABASE STORAGE SETUP FOR OFFER FILES
-- Run these commands in Supabase SQL Editor

-- 1. Create storage bucket (if not created through dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-files',
  'offer-files',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  file_size_limit = 10485760;

-- 2. Create storage policies

-- Policy: Allow public read access to offer files
CREATE POLICY "Public read access for offer files" ON storage.objects
FOR SELECT 
USING (bucket_id = 'offer-files');

-- Policy: Allow authenticated users to upload offer files
CREATE POLICY "Authenticated users can upload offer files" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update offer files
CREATE POLICY "Authenticated users can update offer files" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete offer files  
CREATE POLICY "Authenticated users can delete offer files" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);

-- 3. Verify setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'offer-files';

-- This should return one row showing your bucket configuration
