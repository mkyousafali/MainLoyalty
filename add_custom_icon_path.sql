-- ================================================================
-- ADD CUSTOM ICON PATH FIELD TO SOCIAL LINKS
-- ================================================================
-- This adds the custom_icon_path field to store just the filename
-- (like app-icons does) instead of full URLs

-- Add the custom_icon_path column
ALTER TABLE social_links 
ADD COLUMN IF NOT EXISTS custom_icon_path TEXT;

-- Add comment for clarity
COMMENT ON COLUMN social_links.custom_icon_path IS 'Storage path for uploaded custom icons (filename only)';

-- Update existing records to use path instead of full URL (if any exist)
UPDATE social_links 
SET custom_icon_path = SUBSTRING(custom_icon_url FROM '.*/(.+)$')
WHERE custom_icon_url IS NOT NULL 
  AND custom_icon_url LIKE '%supabase%'
  AND custom_icon_path IS NULL;

-- Verify the changes
SELECT 
  'Updated social_links table' as status,
  count(*) as total_records,
  count(custom_icon_url) as records_with_url,
  count(custom_icon_path) as records_with_path
FROM social_links;

-- Show structure
\d social_links;
