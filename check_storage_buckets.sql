-- STORAGE BUCKET VERIFICATION
-- Run this to check if your storage buckets exist and are configured properly

SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id IN ('offer-thumbnails', 'offer-pdfs');

-- If this returns no rows, you need to run the simple_offers_schema.sql first!
-- The buckets should show:
-- offer-thumbnails: 5MB limit, image types allowed
-- offer-pdfs: 10MB limit, PDF type allowed
