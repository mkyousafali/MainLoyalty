-- Check customer transactions for mobile 0500019376
SELECT 
  ct.*,
  c.customer_code,
  c.full_name,
  c.card_status,
  b.name as branch_name
FROM customer_transactions ct
LEFT JOIN customers c ON c.customer_code = ct.customer_code OR c.mobile = ct.customer_mobile
LEFT JOIN branches b ON b.id = ct.branch_id
WHERE ct.customer_mobile = '0500019376' OR ct.customer_code = '0500019376'
ORDER BY ct.created_at DESC;

-- Check if customer exists
SELECT customer_code, mobile, full_name, card_status, total_points, points
FROM customers 
WHERE customer_code = '0500019376' OR mobile = '0500019376';

-- Check customer_numbers table
SELECT * FROM customer_numbers WHERE customer = '0500019376';
