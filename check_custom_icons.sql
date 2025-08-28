-- First, let's find the correct table name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%link%' OR table_name LIKE '%social%';

-- Check what's stored in the database for custom icons
SELECT 
  id, 
  name, 
  url, 
  use_custom_icon, 
  custom_icon_url,
  updated_at
FROM social_links 
WHERE use_custom_icon = true 
ORDER BY updated_at DESC 
LIMIT 5;

-- Also check what files exist in storage
SELECT 
  name as filename,
  created_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC
LIMIT 5;
