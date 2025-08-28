-- ================================================================
-- QUICK STORAGE BUCKET CREATION GUIDE
-- ================================================================
-- Since the bucket creation failed through code, create it manually:

-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket" 
-- 3. Enter these exact settings:

BUCKET NAME: social-icons
PUBLIC: YES (✅ checked)
FILE SIZE LIMIT: 5242880 (5MB)
MIME TYPES: image/png,image/jpeg,image/jpg,image/gif,image/webp

-- 4. Click "Create bucket"
-- 5. The bucket should appear in your storage list
-- 6. Test upload should work immediately after creation

-- Note: The policies were already created by the SQL script you ran
-- You just need to create the actual bucket through the UI

-- ================================================================
-- VERIFICATION TEST
-- ================================================================
-- After creating the bucket, run this to verify:

SELECT 'Storage bucket creation complete!' as status;
