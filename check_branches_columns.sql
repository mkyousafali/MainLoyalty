-- QUICK CHECK: What columns actually exist in branches table
SELECT 'BRANCHES TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'branches'
ORDER BY ordinal_position;

-- Show a sample row to see the actual data structure
SELECT 'SAMPLE BRANCHES DATA:' as info;
SELECT * FROM branches LIMIT 1;
