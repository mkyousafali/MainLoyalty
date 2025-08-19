-- Check the structure of notification_recipients table (standard SQL)
-- Alternative way to check columns
SELECT * FROM notification_recipients LIMIT 0;

-- Check if table has any data
SELECT COUNT(*) as total_records FROM notification_recipients;

-- Check the column structure properly
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'notification_recipients'
ORDER BY ordinal_position;

-- Test basic insert to see what fields are required
-- (This will likely fail but show us the required fields in error message)
INSERT INTO notification_recipients (notification_id) VALUES ('00000000-0000-0000-0000-000000000000');
