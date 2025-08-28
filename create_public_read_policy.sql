-- ================================================================
-- MANUAL STORAGE POLICY CREATION FOR SOCIAL-ICONS
-- ================================================================
-- Use this if the dashboard method doesn't work

-- Create the public read policy for social-icons bucket
CREATE POLICY "Public read access for social-icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'social-icons');

-- Verify the policy was created
SELECT 
  'POLICY CREATED' as status,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname = 'Public read access for social-icons';
