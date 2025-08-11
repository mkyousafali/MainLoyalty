-- Check customer transactions and points for mobile 0500019376
-- Run this query in Supabase to verify data exists

-- 1. Check customer record and current points
SELECT 
    customer_code,
    mobile,
    full_name,
    total_points,
    points,
    card_status,
    created_at
FROM customers 
WHERE customer_code = '0500019376' OR mobile = '0500019376';

-- 2. Check all transactions for this customer
SELECT 
    bill_no,
    bill_date,
    customer_code,
    customer_mobile,
    points_earned,
    points_redeemed,
    amount,
    branch_id,
    transaction_type,
    status,
    created_at
FROM customer_transactions 
WHERE customer_code = '0500019376' 
   OR customer_mobile = '0500019376'
ORDER BY created_at DESC;

-- 3. Calculate points summary
SELECT 
    COUNT(*) as transaction_count,
    SUM(points_earned) as total_earned,
    SUM(points_redeemed) as total_redeemed,
    SUM(points_earned) - SUM(points_redeemed) as current_balance
FROM customer_transactions 
WHERE customer_code = '0500019376' 
   OR customer_mobile = '0500019376';

-- 4. Check branches data
SELECT id, name, name_ar FROM branches ORDER BY id;

-- 5. Check if there are any upload transactions that created the customer
SELECT * FROM customer_transactions 
WHERE customer_mobile = '0500019376' AND transaction_type = 'upload';
