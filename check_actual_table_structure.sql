-- QUICK FIX: Check actual branches table structure and fix queries
-- Run this first to see what columns actually exist

-- Check what columns are actually in the branches table
SELECT 'ACTUAL BRANCHES TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'branches'
ORDER BY ordinal_position;

-- Check a few sample rows to see the data
SELECT 'SAMPLE BRANCHES DATA:' as info;
SELECT * FROM branches LIMIT 5;

-- Check what columns are actually in the offers table (if it exists)
SELECT 'CHECKING IF OFFERS TABLE EXISTS:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public')
        THEN '✅ OFFERS TABLE EXISTS'
        ELSE '❌ OFFERS TABLE MISSING'
    END as offers_status;

-- If offers exists, show its structure
SELECT 'ACTUAL OFFERS TABLE STRUCTURE (if exists):' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'offers'
ORDER BY ordinal_position;
