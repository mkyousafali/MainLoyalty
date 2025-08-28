-- Get the database records for custom icons
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
