-- COMPLETE DIAGNOSTIC FOR OFFERS SYSTEM ISSUES
-- Run this in Supabase SQL Editor to diagnose the 400 errors

-- ===== STEP 1: CHECK IF TABLES EXIST =====
SELECT 'CHECKING TABLE EXISTENCE' as step;

SELECT 
    table_name,
    table_schema,
    CASE 
        WHEN table_name IN ('offers', 'branches') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('offers', 'branches')
ORDER BY table_name;

-- ===== STEP 2: CHECK TABLE STRUCTURES =====
SELECT 'CHECKING BRANCHES TABLE STRUCTURE' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'branches'
ORDER BY ordinal_position;

SELECT 'CHECKING OFFERS TABLE STRUCTURE' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'offers'
ORDER BY ordinal_position;

-- ===== STEP 3: CHECK RLS POLICIES =====
SELECT 'CHECKING RLS POLICIES' as step;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS ENABLED - Need policies'
        ELSE '✅ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('offers', 'branches');

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('offers', 'branches')
ORDER BY tablename, policyname;

-- ===== STEP 4: CHECK DATA EXISTS =====
SELECT 'CHECKING DATA EXISTENCE' as step;

-- Check branches count
SELECT 
    'branches' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ EMPTY TABLE'
    END as data_status
FROM branches;

-- Check offers count
SELECT 
    'offers' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ EMPTY TABLE'
    END as data_status
FROM offers;

-- ===== STEP 5: TEST ACTUAL QUERIES FROM FRONTEND =====
SELECT 'TESTING FRONTEND QUERIES' as step;

-- Test the exact branches query from frontend
SELECT 'Testing branches query...' as test;
SELECT branch_id, branch_name FROM branches ORDER BY branch_name;

-- Test the exact offers query from frontend
SELECT 'Testing offers query...' as test;
SELECT 
    offer_id,
    title,
    description,
    branch_id,
    discount_percentage,
    valid_until,
    image_url,
    pdf_url,
    is_active,
    created_at
FROM offers 
WHERE is_active = true 
AND valid_until >= CURRENT_DATE
ORDER BY created_at DESC;

-- ===== STEP 6: SAMPLE DATA FOR TESTING =====
SELECT 'SAMPLE DATA SETUP' as step;

-- Insert sample branch if none exists
INSERT INTO branches (branch_name, branch_location, is_active)
SELECT 'Main Branch', 'Downtown', true
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_name = 'Main Branch');

INSERT INTO branches (branch_name, branch_location, is_active)
SELECT 'North Branch', 'North District', true
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_name = 'North Branch');

-- Insert sample offer if none exists
INSERT INTO offers (
    title,
    description,
    branch_id,
    discount_percentage,
    valid_until,
    image_url,
    pdf_url,
    is_active,
    created_at
)
SELECT 
    'Summer Sale',
    'Great discounts on all items',
    (SELECT branch_id FROM branches LIMIT 1),
    25.00,
    '2025-12-31',
    'https://example.com/image.jpg',
    'https://example.com/flyer.pdf',
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE title = 'Summer Sale');

-- ===== STEP 7: FINAL VERIFICATION =====
SELECT 'FINAL VERIFICATION' as step;

SELECT 'Final branch count:' as info, COUNT(*) as count FROM branches;
SELECT 'Final offers count:' as info, COUNT(*) as count FROM offers;

-- Test join query
SELECT 
    o.title,
    o.branch_id,
    b.branch_name
FROM offers o
LEFT JOIN branches b ON o.branch_id = b.branch_id
WHERE o.is_active = true
LIMIT 5;

SELECT '=== DIAGNOSTIC COMPLETE ===' as status;
