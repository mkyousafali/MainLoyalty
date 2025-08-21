-- COMPREHENSIVE OFFER EXPIRATION MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor to enhance expiration handling

-- ===== STEP 1: CHECK CURRENT OFFER STATUS =====
SELECT '=== CURRENT OFFER STATUS ===' as info;

-- Show all offers with their expiration status
SELECT 
    id,
    title,
    valid_until,
    is_active,
    CASE 
        WHEN valid_until < CURRENT_DATE THEN '❌ EXPIRED'
        WHEN valid_until = CURRENT_DATE THEN '⚠️ EXPIRES TODAY'
        WHEN valid_until <= CURRENT_DATE + INTERVAL '7 days' THEN '⏰ EXPIRES SOON (within 7 days)'
        ELSE '✅ ACTIVE'
    END as expiration_status,
    CASE 
        WHEN valid_until < CURRENT_DATE THEN (CURRENT_DATE - valid_until)
        ELSE (valid_until - CURRENT_DATE)
    END as days_difference
FROM offers
ORDER BY valid_until DESC;

-- ===== STEP 2: CREATE AUTOMATIC EXPIRATION FUNCTION =====
SELECT '=== SETTING UP AUTOMATIC EXPIRATION ===' as info;

-- Create a function to automatically deactivate expired offers
CREATE OR REPLACE FUNCTION auto_deactivate_expired_offers()
RETURNS void AS $$
BEGIN
    -- Mark expired offers as inactive (optional - keeps them hidden)
    UPDATE offers 
    SET is_active = false,
        updated_at = NOW()
    WHERE valid_until < CURRENT_DATE 
    AND is_active = true;
    
    -- Log the action
    RAISE NOTICE 'Deactivated % expired offers', (
        SELECT COUNT(*) FROM offers 
        WHERE valid_until < CURRENT_DATE AND is_active = false
    );
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 3: CREATE EXPIRATION REPORT VIEWS =====
SELECT '=== CREATING EXPIRATION VIEWS ===' as info;

-- View for expired offers
CREATE OR REPLACE VIEW expired_offers AS
SELECT 
    o.*,
    b.branch_name,
    (CURRENT_DATE - o.valid_until) as days_expired
FROM offers o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.valid_until < CURRENT_DATE;

-- View for offers expiring soon
CREATE OR REPLACE VIEW expiring_soon_offers AS
SELECT 
    o.*,
    b.branch_name,
    (o.valid_until - CURRENT_DATE) as days_until_expiry
FROM offers o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.valid_until >= CURRENT_DATE 
AND o.valid_until <= CURRENT_DATE + INTERVAL '7 days'
AND o.is_active = true;

-- ===== STEP 4: OFFER CLEANUP FUNCTIONS =====
SELECT '=== CREATING CLEANUP FUNCTIONS ===' as info;

-- Function to permanently delete old expired offers (use carefully!)
CREATE OR REPLACE FUNCTION cleanup_old_expired_offers(older_than_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete offers that expired more than X days ago
    DELETE FROM offers 
    WHERE valid_until < CURRENT_DATE - INTERVAL '1 day' * older_than_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % offers older than % days', deleted_count, older_than_days;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive expired offers to a separate table (recommended approach)
CREATE TABLE IF NOT EXISTS archived_offers (
    LIKE offers INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION archive_expired_offers()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move expired offers to archive
    INSERT INTO archived_offers (
        id, title, description, branch_id, discount_percentage, discount_amount,
        minimum_purchase, valid_from, valid_until, image_url, pdf_url,
        terms_conditions, max_redemptions, current_redemptions,
        is_active, created_at, updated_at, archived_at
    )
    SELECT 
        id, title, description, branch_id, discount_percentage, discount_amount,
        minimum_purchase, valid_from, valid_until, image_url, pdf_url,
        terms_conditions, max_redemptions, current_redemptions,
        is_active, created_at, updated_at, NOW()
    FROM offers 
    WHERE valid_until < CURRENT_DATE - INTERVAL '30 days'
    ON CONFLICT (id) DO NOTHING;
    
    -- Delete from main table
    DELETE FROM offers 
    WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RAISE NOTICE 'Archived % expired offers', archived_count;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 5: TEST THE SYSTEM =====
SELECT '=== TESTING EXPIRATION SYSTEM ===' as info;

-- Test the views
SELECT 'Expired offers:' as test;
SELECT COUNT(*) as count FROM expired_offers;

SELECT 'Expiring soon:' as test;
SELECT COUNT(*) as count FROM expiring_soon_offers;

-- Show sample data
SELECT 'Sample expiring soon offers:' as test;
SELECT title, branch_name, valid_until, days_until_expiry 
FROM expiring_soon_offers 
LIMIT 5;

-- ===== STEP 6: USAGE INSTRUCTIONS =====
SELECT '=== USAGE INSTRUCTIONS ===' as info;

SELECT 'To manually deactivate expired offers, run:' as instruction;
SELECT 'SELECT auto_deactivate_expired_offers();' as command;

SELECT 'To archive old expired offers (30+ days), run:' as instruction;
SELECT 'SELECT archive_expired_offers();' as command;

SELECT 'To permanently delete very old offers (90+ days), run:' as instruction;
SELECT 'SELECT cleanup_old_expired_offers(90);' as command;

SELECT 'To check current status, query these views:' as instruction;
SELECT '- expired_offers' as view;
SELECT '- expiring_soon_offers' as view;

SELECT '=== EXPIRATION MANAGEMENT SYSTEM READY ===' as status;
