-- ================================================================
-- CREATE SOCIAL-ICONS STORAGE POLICIES (Missing Policies)
-- ================================================================
-- Your bucket is public but missing the RLS policies for social-icons

-- Step 1: Create public read policy for social-icons
CREATE POLICY "Public read access for social-icons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'social-icons');

-- Step 2: Create upload policy for social-icons  
CREATE POLICY "Authenticated users can upload social-icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'social-icons');

-- Step 3: Create update policy for social-icons
CREATE POLICY "Authenticated users can update social-icons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'social-icons')
WITH CHECK (bucket_id = 'social-icons');

-- Step 4: Create delete policy for social-icons
CREATE POLICY "Authenticated users can delete social-icons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'social-icons');

-- Step 5: Verify policies were created
SELECT 
  'SOCIAL-ICONS POLICIES' as status,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%social-icons%';
