-- QUICK DIAGNOSTIC FOR add_amt COLUMN ISSUE
-- Run this first to understand what's happening

-- 1. Check exact column definition
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customer_transactions' 
AND column_name = 'add_amt';

-- 2. Check current values and their data types
SELECT 
    'Current add_amt values:' as info;
    
SELECT 
    customer_code,
    add_amt,
    pg_typeof(add_amt) as data_type,
    add_amt::text as text_representation
FROM customer_transactions 
WHERE add_amt IS NOT NULL 
AND add_amt != 0
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Try to insert a test decimal value
INSERT INTO customer_transactions (
    customer_code,
    customer_mobile,
    bill_no,
    bill_date,
    amount,
    bill_amount,
    add_amt,
    transaction_type
) VALUES (
    'DECIMAL_TEST_001',
    '0548357066',
    'TEST_DEC',
    '2025-08-09',
    10.50,
    10.50,
    0.28,  -- This should store as 0.280 if column is DECIMAL
    'purchase'
);

-- 4. Check if the test value was stored correctly
SELECT 
    customer_code,
    add_amt,
    add_amt::text as stored_as_text,
    CASE 
        WHEN add_amt = 0.28 THEN '✅ DECIMAL WORKING'
        WHEN add_amt = 0 THEN '❌ CONVERTED TO INTEGER'
        ELSE '❓ OTHER: ' || add_amt::text
    END as status
FROM customer_transactions 
WHERE customer_code = 'DECIMAL_TEST_001';

-- 5. Clean up test
DELETE FROM customer_transactions WHERE customer_code = 'DECIMAL_TEST_001';
