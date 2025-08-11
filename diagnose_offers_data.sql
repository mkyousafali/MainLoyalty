-- DIAGNOSTIC SCRIPT FOR OFFERS MANAGEMENT
-- Run this in Supabase SQL Editor to check current state

SELECT '=== CHECKING OFFERS TABLE ===' as step;

-- Check if offers table exists
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'offers' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'offers';

-- Check offers table structure
SELECT 'Offers table columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'offers'
ORDER BY ordinal_position;

-- Check offers data count
SELECT 'Total offers in database:' as info, COUNT(*) as count FROM offers;

-- Check active offers
SELECT 'Active offers:' as info, COUNT(*) as count 
FROM offers 
WHERE is_active = true AND valid_until >= CURRENT_DATE;

-- Sample offers data
SELECT 'Sample offers (first 5):' as info;
SELECT 
    id,
    title,
    branch_id,
    discount_percentage,
    discount_amount,
    valid_until,
    is_active,
    CASE 
        WHEN valid_until < CURRENT_DATE THEN 'Expired'
        WHEN NOT is_active THEN 'Inactive'
        ELSE 'Active'
    END as status
FROM offers 
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== CHECKING BRANCHES TABLE ===' as step;

-- Check branches table structure
SELECT 'Branches table columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'branches'
ORDER BY ordinal_position;

-- Check branches data
SELECT 'Active branches:' as info, COUNT(*) as count 
FROM branches 
WHERE is_active = true;

-- Sample branches data
SELECT 'Sample branches (first 5):' as info;
SELECT 
    id,
    COALESCE(branch_name, name, title, 'Unnamed') as display_name,
    is_active
FROM branches 
WHERE is_active = true
ORDER BY created_at
LIMIT 5;

SELECT '=== CHECKING FOREIGN KEY RELATIONSHIP ===' as step;

-- Test join between offers and branches
SELECT 'Offers with branch info:' as info;
SELECT 
    o.id as offer_id,
    o.title,
    o.branch_id,
    COALESCE(b.branch_name, b.name, b.title, 'All Branches') as branch_display_name,
    o.is_active,
    o.valid_until
FROM offers o
LEFT JOIN branches b ON o.branch_id = b.id
ORDER BY o.created_at DESC
LIMIT 5;

SELECT '=== STORAGE BUCKETS CHECK ===' as step;

-- Check storage buckets
SELECT 'Storage buckets:' as info;
SELECT 
    id,
    name,
    public,
    CASE 
        WHEN id IN ('offer-images', 'offer-pdfs') THEN '✅ CONFIGURED'
        ELSE '📁 OTHER'
    END as status
FROM storage.buckets
ORDER BY name;

SELECT '=== DIAGNOSTIC COMPLETE ===' as result;

-- Recommended actions based on findings
SELECT 'NEXT STEPS:' as action;
SELECT '1. Run create_offers_table_proper.sql if offers table is missing' as step1;
SELECT '2. Run insert_sample_offers_data.sql to add test data' as step2;
SELECT '3. Check frontend console for any JavaScript errors' as step3;
SELECT '4. Verify Supabase connection in browser network tab' as step4;
