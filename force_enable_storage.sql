-- FORCE ENABLE STORAGE SERVICE
-- Run this in Supabase SQL Editor

-- Check if storage extension is enabled
SELECT 'Storage extension status:' as info;
SELECT * FROM pg_extension WHERE extname = 'storage';

-- Try to enable storage extension (this might fail if already enabled)
CREATE EXTENSION IF NOT EXISTS "storage";

-- Check storage configuration
SELECT 'Storage configuration:' as info;
SELECT name, setting FROM pg_settings WHERE name LIKE '%storage%';

-- Verify storage tables exist
SELECT 'Storage tables:' as info;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'storage';

-- List all buckets (should work if storage is enabled)
SELECT 'All buckets via direct table access:' as info;
SELECT id, name, public, created_at FROM storage.buckets;

-- If buckets exist but API doesn't work, it's a service enablement issue
SELECT 'DIAGNOSIS: If you see buckets above but get "no buckets found" in app, Storage API is disabled in dashboard!' as status;
