-- ⚠️ PARTNER APPS CLEANUP - SAFE REMOVAL ⚠️
-- This script ONLY removes Partner Apps tables and will NOT affect your main loyalty system
-- Your loyalty system tables (customers, transactions, branches, etc.) are completely safe

-- ✅ SAFE TO REMOVE - These tables/views are NOT part of your main loyalty system:
-- First drop views (some might be views, not tables)
DROP VIEW IF EXISTS partner_apps_with_user_status CASCADE;
DROP VIEW IF EXISTS partner_app_stats CASCADE;
DROP VIEW IF EXISTS user_partner_app_stats CASCADE;
DROP VIEW IF EXISTS partner_sso_session_stats CASCADE;

-- Then drop tables
DROP TABLE IF EXISTS partner_sso_tokens CASCADE;
DROP TABLE IF EXISTS partner_sso_sessions CASCADE;
DROP TABLE IF EXISTS partner_sso_keys CASCADE;
DROP TABLE IF EXISTS partner_logs CASCADE;
DROP TABLE IF EXISTS partner_grants CASCADE;
DROP TABLE IF EXISTS partner_app_trusts CASCADE;
DROP TABLE IF EXISTS partner_app_analytics CASCADE;
DROP TABLE IF EXISTS user_partner_app_identity CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;  -- ⚠️ Only if this is Partner Apps specific, NOT customer profiles
DROP TABLE IF EXISTS partner_apps CASCADE;

-- 🛡️ PROTECTED TABLES (These will NOT be touched):
-- ✅ customers - Your main customer database
-- ✅ customer_transactions - All purchase/point transactions  
-- ✅ branches - Your store locations
-- ✅ card_types - Loyalty card tiers (Bronze, Silver, Gold, etc.)
-- ✅ admin_users - Your admin login system
-- ✅ coupons, offers, special_gifts - Your rewards system
-- ✅ notifications - Your messaging system
-- ✅ All other main loyalty system tables are SAFE

-- Drop any additional views that might depend on these tables
DROP VIEW IF EXISTS partner_app_user_summary CASCADE;
DROP VIEW IF EXISTS partner_session_analytics CASCADE;

-- Drop any indexes that might have been created
DROP INDEX IF EXISTS idx_partner_apps_enabled;
DROP INDEX IF EXISTS idx_partner_apps_category;
DROP INDEX IF EXISTS idx_user_partner_app_identity_user_id;
DROP INDEX IF EXISTS idx_user_partner_app_identity_app_id;
DROP INDEX IF EXISTS idx_partner_sso_sessions_user_id;
DROP INDEX IF EXISTS idx_partner_sso_sessions_app_id;
DROP INDEX IF EXISTS idx_user_profiles_user_id;

-- Drop any functions that might have been created
DROP FUNCTION IF EXISTS get_partner_app_stats() CASCADE;
DROP FUNCTION IF EXISTS create_partner_sso_token(text, text, text) CASCADE;

-- Clean up any remaining sequences
DROP SEQUENCE IF EXISTS partner_apps_sort_order_seq CASCADE;

-- Verify cleanup
SELECT 'Partner Apps tables cleanup completed successfully' as status;

-- Show remaining tables to verify
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%partner%';
