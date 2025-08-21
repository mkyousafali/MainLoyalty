-- ======================================
-- ADD MISSING CONTACT_NUMBER COLUMN TO BRANCHES TABLE
-- ======================================
-- The frontend expects 'contact_number' but the database has 'contact_phone'
-- Adding the missing column to fix the branch editing functionality

-- Check current branches table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'branches' 
ORDER BY ordinal_position;

-- Add the missing contact_number column
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Add the missing snapchat column (frontend expects 'snapchat', database has 'snap')
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS snapchat TEXT;

-- Copy data from existing columns if needed
UPDATE branches 
SET contact_number = contact_phone 
WHERE contact_number IS NULL AND contact_phone IS NOT NULL;

UPDATE branches 
SET snapchat = snap 
WHERE snapchat IS NULL AND snap IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'branches' 
  AND column_name IN ('contact_phone', 'contact_number', 'snap', 'snapchat')
ORDER BY column_name;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ MISSING COLUMNS ADDED TO BRANCHES TABLE!';
    RAISE NOTICE '🔧 Frontend branch editing should now work properly';
    RAISE NOTICE '📱 Added contact_number column (from contact_phone)';
    RAISE NOTICE '👻 Added snapchat column (from snap)';
    RAISE NOTICE '🔄 Existing data copied to new columns';
END $$;
