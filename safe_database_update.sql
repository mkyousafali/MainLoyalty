-- ========================================
-- SAFE DATABASE UPDATE - BACKWARD COMPATIBLE
-- ========================================
-- This update maintains backward compatibility

-- Step 1: Add new columns (keeping existing ones)
ALTER TABLE other_apps ADD COLUMN IF NOT EXISTS icon_path TEXT;
ALTER TABLE other_apps ADD COLUMN IF NOT EXISTS icon_filename TEXT;

-- Step 2: Fix iframe-blocking URLs
UPDATE other_apps SET 
  url = 'https://web.whatsapp.com'
WHERE name = 'WhatsApp Business' AND url LIKE '%business.whatsapp.com%';

UPDATE other_apps SET 
  url = 'https://teams.microsoft.com/go'  
WHERE name = 'Microsoft Teams' AND url LIKE '%teams.microsoft.com%';

-- Step 3: Add iframe-friendly sample apps
INSERT INTO other_apps (name, url, description, category, sort_order) VALUES 
('Gmail', 'https://mail.google.com', 'Google email service', 'communication', 100),
('Google Calendar', 'https://calendar.google.com', 'Google calendar and scheduling', 'productivity', 101),
('Google Docs', 'https://docs.google.com', 'Document creation and editing', 'productivity', 102)
ON CONFLICT DO NOTHING;

SELECT 'Safe database update completed!' as status;
