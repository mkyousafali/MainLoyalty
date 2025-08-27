-- DISABLE RLS FOR OFFER ADVERTISEMENTS SYSTEM
-- Run this in Supabase SQL Editor to completely remove RLS restrictions

-- Completely disable Row Level Security for both tables
ALTER TABLE offer_advertisements DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Public can view active offers" ON offer_advertisements;
DROP POLICY IF EXISTS "Authenticated users can manage offers" ON offer_advertisements;
DROP POLICY IF EXISTS "Anyone can view active offers" ON offer_advertisements;
DROP POLICY IF EXISTS "Authenticated full access to offers" ON offer_advertisements;
DROP POLICY IF EXISTS "Only authenticated users can access admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Authenticated full access to settings" ON admin_settings;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('offer_advertisements', 'admin_settings')
  AND schemaname = 'public';

-- This should show rls_enabled = false for both tables
