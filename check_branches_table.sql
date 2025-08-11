-- CHECK BRANCHES TABLE STRUCTURE
-- Run this in Supabase SQL Editor to verify the table structure

-- Check table exists and structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'branches' 
ORDER BY ordinal_position;

-- Check current data
SELECT 'Current branch data:' as info;
SELECT * FROM branches LIMIT 10;

-- Check if any RLS policies are blocking access
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
