-- CLEANUP MALFORMED OFFER URLS
-- Run this in Supabase SQL Editor to fix any existing offers with bad URLs

-- Update offers with malformed Google Drive URLs to use proper placeholder
UPDATE offer_advertisements 
SET thumbnail_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzlGRjE0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+T2ZmZXIgVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
WHERE thumbnail_url LIKE '%drive.google.com/drive/folders/%/%' 
   OR thumbnail_url LIKE '%drive.google.com/uc?id=%'
   OR thumbnail_url LIKE '%via.placeholder.com%';

-- Update offers with malformed PDF URLs to use sample PDF
UPDATE offer_advertisements 
SET pdf_url = 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf'
WHERE pdf_url LIKE '%drive.google.com/drive/folders/%/%' 
   OR pdf_url LIKE '%drive.google.com/file/d/%'
   OR pdf_url LIKE '%w3.org/WAI/ER/%';

-- Check the updated offers
SELECT 
  id,
  offer_name,
  thumbnail_url,
  pdf_url,
  status
FROM offer_advertisements 
ORDER BY created_at DESC;
