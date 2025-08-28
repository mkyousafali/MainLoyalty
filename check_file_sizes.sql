-- Check file sizes and metadata in storage bucket
SELECT 
  name as filename,
  created_at,
  updated_at,
  metadata->>'size' as file_size_bytes,
  CASE 
    WHEN (metadata->>'size')::integer = 0 THEN '❌ ZERO BYTES'
    WHEN (metadata->>'size')::integer < 1000 THEN '⚠️ VERY SMALL'
    ELSE '✅ NORMAL SIZE'
  END as size_status,
  metadata->>'mimetype' as mime_type,
  metadata->>'cacheControl' as cache_control
FROM storage.objects 
WHERE bucket_id = 'social-icons'
ORDER BY created_at DESC
LIMIT 10;
