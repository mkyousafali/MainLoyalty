-- ========================================
-- UPDATE EXISTING OTHER_APPS TABLE SCHEMA
-- ========================================
-- Add new columns for icon uploads and handle existing data

-- Add new columns for icon file support
ALTER TABLE other_apps ADD COLUMN IF NOT EXISTS icon_path TEXT;
ALTER TABLE other_apps ADD COLUMN IF NOT EXISTS icon_filename TEXT;

-- Optional: Remove old icon_url column after migrating data
-- ALTER TABLE other_apps DROP COLUMN IF EXISTS icon_url;

-- Update sample apps to remove iframe-blocking URLs
UPDATE other_apps SET 
  url = 'https://web.whatsapp.com'
WHERE name = 'WhatsApp Business' AND url = 'https://business.whatsapp.com';

UPDATE other_apps SET 
  url = 'https://teams.microsoft.com/go'
WHERE name = 'Microsoft Teams' AND url = 'https://teams.microsoft.com';

SELECT 'Database schema updated successfully!' as status;
