-- ===================================
-- BRANCHES TABLE CLEANUP & ENHANCEMENT
-- Run this in Supabase SQL Editor
-- ===================================

-- Step 1: Add TikTok column
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS tiktok TEXT NULL;

-- Step 2: Migrate data from duplicate columns to main columns (if data exists)
-- Migrate instagram_url to instagram (keep the one with data)
UPDATE public.branches 
SET instagram = COALESCE(instagram, instagram_url)
WHERE instagram IS NULL AND instagram_url IS NOT NULL;

-- Migrate website_url to website (keep the one with data)
UPDATE public.branches 
SET website = COALESCE(website, website_url)
WHERE website IS NULL AND website_url IS NOT NULL;

-- Migrate snap and snap_url to snapchat (keep the one with data)
UPDATE public.branches 
SET snapchat = COALESCE(snapchat, snap, snap_url)
WHERE snapchat IS NULL AND (snap IS NOT NULL OR snap_url IS NOT NULL);

-- Migrate phone and contact_phone to contact_number (keep the one with data)
UPDATE public.branches 
SET contact_number = COALESCE(contact_number, phone, contact_phone)
WHERE contact_number IS NULL AND (phone IS NOT NULL OR contact_phone IS NOT NULL);

-- Step 3: Drop duplicate columns (after data migration)
ALTER TABLE public.branches DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE public.branches DROP COLUMN IF EXISTS website_url;
ALTER TABLE public.branches DROP COLUMN IF EXISTS snap_url;
ALTER TABLE public.branches DROP COLUMN IF EXISTS snap;
ALTER TABLE public.branches DROP COLUMN IF EXISTS phone;
ALTER TABLE public.branches DROP COLUMN IF EXISTS contact_phone;

-- Step 4: Create indexes for new/remaining columns
CREATE INDEX IF NOT EXISTS idx_branches_tiktok ON public.branches USING btree (tiktok);
CREATE INDEX IF NOT EXISTS idx_branches_email ON public.branches USING btree (email);
CREATE INDEX IF NOT EXISTS idx_branches_manager_name ON public.branches USING btree (manager_name);

-- Step 5: Add any missing columns that should be there
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS name TEXT NULL;

-- Update the name column to use name_en if name is empty
UPDATE public.branches 
SET name = name_en 
WHERE name IS NULL AND name_en IS NOT NULL;

-- Step 6: Verify the final structure
-- Run this to see your clean table structure:
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'branches'
ORDER BY ordinal_position;

-- Step 7: Show table constraints and indexes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'branches'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 8: Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'branches'
ORDER BY indexname;
