-- COMPLETE BRANCHES SETUP AND TESTING
-- Run this step-by-step in Supabase SQL Editor

-- Step 1: Check if branches table exists and its structure
SELECT 'Step 1: Checking branches table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'branches' 
ORDER BY ordinal_position;

-- Step 2: Check current branches data
SELECT 'Step 2: Current branches in database' as info;
SELECT * FROM branches ORDER BY branch_name;

-- Step 3: Count current branches
SELECT 'Step 3: Branch count' as info;
SELECT COUNT(*) as total_branches FROM branches;
SELECT COUNT(*) as active_branches FROM branches WHERE is_active = true;

-- Step 4: Insert sample branches if table is empty
-- This will only insert if branches don't already exist
INSERT INTO branches (branch_name, location, phone_number, is_active, created_at, updated_at) 
VALUES 
    ('Al Malqa Branch', 'Al Malqa District, Riyadh', '+966-11-234-5678', true, NOW(), NOW()),
    ('Al Rabwa Branch', 'Al Rabwa District, Riyadh', '+966-11-345-6789', true, NOW(), NOW()),
    ('Al Nakheel Branch', 'Al Nakheel District, Riyadh', '+966-11-456-7890', true, NOW(), NOW()),
    ('Riyadh Park Branch', 'Riyadh Park Mall, Riyadh', '+966-11-567-8901', true, NOW(), NOW()),
    ('King Fahd Branch', 'King Fahd Road, Riyadh', '+966-11-678-9012', true, NOW(), NOW()),
    ('Olaya Branch', 'Olaya Street, Riyadh', '+966-11-789-0123', true, NOW(), NOW()),
    ('Diplomatic Quarter Branch', 'Diplomatic Quarter, Riyadh', '+966-11-890-1234', true, NOW(), NOW())
ON CONFLICT (branch_name) DO NOTHING;

-- Step 5: Verify branches were created
SELECT 'Step 5: Branches after insert' as info;
SELECT branch_id, branch_name, location, is_active, created_at FROM branches ORDER BY branch_name;

-- Step 6: Test the exact query used by the frontend
SELECT 'Step 6: Testing frontend query' as info;
SELECT branch_id, branch_name 
FROM branches 
ORDER BY branch_name;

-- Step 7: Check RLS policies that might block frontend access
SELECT 'Step 7: Checking RLS policies on branches table' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'branches';

-- Step 8: Check if RLS is enabled on branches table
SELECT 'Step 8: Checking if RLS is enabled' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'branches';

-- Step 9: If RLS is blocking, temporarily disable it for testing
-- UNCOMMENT THESE LINES IF RLS IS BLOCKING ACCESS:
-- ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
-- GRANT SELECT ON branches TO anon;
-- GRANT SELECT ON branches TO authenticated;

-- Step 10: Final verification
SELECT 'Step 10: Final branch count and sample' as info;
SELECT COUNT(*) as total_active_branches FROM branches WHERE is_active = true;
SELECT 'Sample branches:' as info;
SELECT branch_id, branch_name FROM branches WHERE is_active = true LIMIT 3;
