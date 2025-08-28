-- Update social_links table to support static icons
ALTER TABLE social_links 
ADD COLUMN IF NOT EXISTS static_icon VARCHAR(255);

-- Update existing records to use static icons
UPDATE social_links 
SET static_icon = CASE 
    WHEN LOWER(name) LIKE '%facebook%' THEN 'facebook.png'
    WHEN LOWER(name) LIKE '%instagram%' THEN 'instagram.png' 
    WHEN LOWER(name) LIKE '%twitter%' THEN 'twitter.png'
    WHEN LOWER(name) LIKE '%whatsapp%' OR LOWER(name) LIKE '%واتساب%' THEN 'whatsapp.png'
    WHEN LOWER(name) LIKE '%linkedin%' THEN 'linkedin.png'
    WHEN LOWER(name) LIKE '%youtube%' THEN 'youtube.png'
    WHEN LOWER(name) LIKE '%tiktok%' THEN 'tiktok.png'
    WHEN LOWER(name) LIKE '%snapchat%' THEN 'snapchat.png'
    WHEN LOWER(name) LIKE '%telegram%' THEN 'telegram.png'
    ELSE 'facebook.png'
END,
use_custom_icon = true,
custom_icon_url = NULL
WHERE static_icon IS NULL;
