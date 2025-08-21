-- ========================================
-- IFRAME COMPATIBILITY REFERENCE
-- ========================================

-- 🟢 IFRAME-FRIENDLY APPS (Usually work in embedded frames)
-- ===============================================

INSERT INTO other_apps (name, url, description, category, sort_order) VALUES 
-- Google Services (usually iframe-friendly)
('Gmail', 'https://mail.google.com', 'Google email service', 'communication', 100),
('Google Calendar', 'https://calendar.google.com', 'Google calendar and scheduling', 'productivity', 101),
('Google Docs', 'https://docs.google.com', 'Document creation and editing', 'productivity', 102),
('Google Sheets', 'https://sheets.google.com', 'Spreadsheet creation and editing', 'productivity', 103),
('Google Drive', 'https://drive.google.com', 'Cloud storage and file management', 'productivity', 104),

-- Design & Development Tools
('Figma', 'https://figma.com', 'Collaborative design tool', 'design', 105),
('Canva', 'https://canva.com', 'Design and graphics creation tool', 'design', 106),
('CodePen', 'https://codepen.io', 'Online code editor and sharing', 'development', 107),

-- Productivity Tools
('Notion', 'https://notion.so', 'All-in-one workspace for notes and docs', 'productivity', 108),
('Trello', 'https://trello.com', 'Project management and task organization', 'productivity', 109),
('Airtable', 'https://airtable.com', 'Spreadsheet-database hybrid', 'productivity', 110),

-- Communication (Web versions)
('WhatsApp Web', 'https://web.whatsapp.com', 'WhatsApp web interface', 'communication', 111),
('Telegram Web', 'https://web.telegram.org', 'Telegram web client', 'communication', 112)

ON CONFLICT DO NOTHING;

-- 🔴 NON-IFRAME-FRIENDLY APPS (Block iframe embedding)
-- ===================================================
-- These apps typically block iframe embedding due to security policies:
-- 
-- • https://business.whatsapp.com (CSP: frame-ancestors 'self')
-- • https://teams.microsoft.com (X-Frame-Options: DENY)
-- • https://bot.wabis.in (CSP: frame-ancestors 'self')
-- • Most banking websites
-- • Most social media main sites (Facebook, Twitter, Instagram)
-- • Most authentication/login pages
-- 
-- For these apps, the system will automatically:
-- 1. Detect the blocking policy
-- 2. Show a user-friendly error message
-- 3. Provide "Open in New Tab" option

SELECT 'Iframe compatibility reference updated!' as status;
