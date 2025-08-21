-- REMOVE COUPON, SPECIAL GIFT, AND REWARD CATEGORIES FUNCTIONALITY
-- Run this in Supabase SQL Editor to clean up the database

-- ===== STEP 1: DROP DEPENDENT TABLES FIRST =====
SELECT 'Dropping dependent tables...' as step;

-- Drop customer coupons table (has foreign key to coupons)
DROP TABLE IF EXISTS customer_coupons CASCADE;

-- Drop customer gift points table (has foreign key to special_gifts)
DROP TABLE IF EXISTS customer_gift_points CASCADE;

-- Drop customer rewards table (has foreign key to reward_categories)
DROP TABLE IF EXISTS customer_rewards CASCADE;

-- ===== STEP 2: DROP MAIN TABLES =====
SELECT 'Dropping main tables...' as step;

-- Drop coupons table
DROP TABLE IF EXISTS coupons CASCADE;

-- Drop special_gifts table  
DROP TABLE IF EXISTS special_gifts CASCADE;

-- Drop reward_categories table
DROP TABLE IF EXISTS reward_categories CASCADE;

-- ===== STEP 3: DROP RELATED INDEXES (if they exist separately) =====
SELECT 'Dropping related indexes...' as step;

-- Drop coupon-related indexes
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_coupons_status;
DROP INDEX IF EXISTS idx_customer_coupons_customer_id;

-- Drop gift-related indexes (if any exist)
DROP INDEX IF EXISTS idx_special_gifts_status;
DROP INDEX IF EXISTS idx_customer_gift_points_customer_id;

-- Drop reward category indexes (if any exist)
DROP INDEX IF EXISTS idx_reward_categories_active;
DROP INDEX IF EXISTS idx_customer_rewards_category;

-- ===== STEP 4: VERIFY CLEANUP =====
SELECT 'Verification - Checking remaining tables...' as step;

-- Check if tables are gone
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('coupons', 'special_gifts', 'reward_categories', 'customer_coupons', 'customer_gift_points', 'customer_rewards')
        THEN '❌ SHOULD BE DELETED'
        ELSE '✅ OK'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'special_gifts', 'reward_categories', 'customer_coupons', 'customer_gift_points', 'customer_rewards')
ORDER BY table_name;

-- List remaining tables to confirm cleanup
SELECT 'Remaining tables in database:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT '=== CLEANUP COMPLETE ===' as status;
SELECT 'The following functionality has been removed:' as info;
SELECT '- Manage Coupons (coupons table)' as removed;
SELECT '- Special Gift (special_gifts table)' as removed;
SELECT '- Reward Categories (reward_categories table)' as removed;
SELECT '- All related customer association tables' as removed;
