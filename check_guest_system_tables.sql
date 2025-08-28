-- ================================================================
-- GUEST SYSTEM TABLES & BUCKETS EXISTENCE CHECKER
-- ================================================================
-- This script checks if all required tables and storage buckets exist
-- for the guest login and social links system
-- ================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    bucket_exists BOOLEAN;
    column_exists BOOLEAN;
    function_exists BOOLEAN;
    view_exists BOOLEAN;
    trigger_exists BOOLEAN;
    branch_count INTEGER;
    social_count INTEGER;
    logs_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 CHECKING GUEST SYSTEM REQUIREMENTS...';
    RAISE NOTICE '';
    
    -- ================================================================
    -- 1. CHECK ESSENTIAL TABLES
    -- ================================================================
    RAISE NOTICE '📋 CHECKING TABLES:';
    
    -- Check branches table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'branches'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ branches table exists';
        
        -- Check important columns in branches table
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'branches' 
            AND column_name = 'is_active'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '  ✅ branches.is_active column exists';
        ELSE
            RAISE NOTICE '  ❌ branches.is_active column missing';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ branches table does NOT exist';
    END IF;
    
    -- Check social_links table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'social_links'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ social_links table exists';
        
        -- Check important columns in social_links table
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'social_links' 
            AND column_name = 'custom_icon_url'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '  ✅ social_links.custom_icon_url column exists';
        ELSE
            RAISE NOTICE '  ❌ social_links.custom_icon_url column missing';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'social_links' 
            AND column_name = 'use_custom_icon'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '  ✅ social_links.use_custom_icon column exists';
        ELSE
            RAISE NOTICE '  ❌ social_links.use_custom_icon column missing';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ social_links table does NOT exist';
    END IF;
    
    -- Check guest_login_logs table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'guest_login_logs'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ guest_login_logs table exists';
        
        -- Check important columns
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'guest_login_logs' 
            AND column_name = 'session_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '  ✅ guest_login_logs.session_id column exists';
        ELSE
            RAISE NOTICE '  ❌ guest_login_logs.session_id column missing';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'guest_login_logs' 
            AND column_name = 'device_type'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '  ✅ guest_login_logs.device_type column exists';
        ELSE
            RAISE NOTICE '  ❌ guest_login_logs.device_type column missing';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ guest_login_logs table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 2. CHECK STORAGE BUCKETS
    -- ================================================================
    RAISE NOTICE '🗂️ CHECKING STORAGE BUCKETS:';
    
    -- Check social-icons bucket
    SELECT EXISTS (
        SELECT FROM storage.buckets 
        WHERE name = 'social-icons'
    ) INTO bucket_exists;
    
    IF bucket_exists THEN
        RAISE NOTICE '✅ social-icons storage bucket exists';
        
        -- Check if bucket is public
        SELECT public FROM storage.buckets WHERE name = 'social-icons' INTO bucket_exists;
        IF bucket_exists THEN
            RAISE NOTICE '  ✅ social-icons bucket is public';
        ELSE
            RAISE NOTICE '  ⚠️ social-icons bucket is private (may need to be public for guest access)';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ social-icons storage bucket does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 3. CHECK FUNCTIONS
    -- ================================================================
    RAISE NOTICE '🔧 CHECKING FUNCTIONS:';
    
    -- Check track_guest_login function
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'track_guest_login'
        AND routine_type = 'FUNCTION'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ track_guest_login() function exists';
    ELSE
        RAISE NOTICE '❌ track_guest_login() function does NOT exist';
    END IF;
    
    -- Check update_guest_activity function
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'update_guest_activity'
        AND routine_type = 'FUNCTION'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ update_guest_activity() function exists';
    ELSE
        RAISE NOTICE '❌ update_guest_activity() function does NOT exist';
    END IF;
    
    -- Check close_guest_session function
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'close_guest_session'
        AND routine_type = 'FUNCTION'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ close_guest_session() function exists';
    ELSE
        RAISE NOTICE '❌ close_guest_session() function does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 4. CHECK VIEWS
    -- ================================================================
    RAISE NOTICE '👁️ CHECKING VIEWS:';
    
    -- Check guest_analytics view
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'guest_analytics'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE '✅ guest_analytics view exists';
    ELSE
        RAISE NOTICE '❌ guest_analytics view does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 5. CHECK INDEXES
    -- ================================================================
    RAISE NOTICE '📊 CHECKING INDEXES:';
    
    -- Check branches indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'branches' 
        AND indexname = 'idx_branches_is_active'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ idx_branches_is_active index exists';
    ELSE
        RAISE NOTICE '❌ idx_branches_is_active index missing';
    END IF;
    
    -- Check social_links indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'social_links' 
        AND indexname = 'idx_social_links_branch_id'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ idx_social_links_branch_id index exists';
    ELSE
        RAISE NOTICE '❌ idx_social_links_branch_id index missing';
    END IF;
    
    -- Check guest_login_logs indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'guest_login_logs' 
        AND indexname = 'idx_guest_login_logs_branch_id'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ idx_guest_login_logs_branch_id index exists';
    ELSE
        RAISE NOTICE '❌ idx_guest_login_logs_branch_id index missing';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 6. CHECK FOREIGN KEY CONSTRAINTS
    -- ================================================================
    RAISE NOTICE '🔗 CHECKING FOREIGN KEY CONSTRAINTS:';
    
    -- Check social_links -> branches foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'social_links'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'branch_id'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ social_links -> branches foreign key exists';
    ELSE
        RAISE NOTICE '❌ social_links -> branches foreign key missing';
    END IF;
    
    -- Check guest_login_logs -> branches foreign key
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'guest_login_logs'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'branch_id'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ guest_login_logs -> branches foreign key exists';
    ELSE
        RAISE NOTICE '❌ guest_login_logs -> branches foreign key missing';
    END IF;
    
    RAISE NOTICE '';
    
    -- ================================================================
    -- 7. SAMPLE DATA CHECK
    -- ================================================================
    RAISE NOTICE '📋 CHECKING DATA:';
    
    -- Check if branches have data
    SELECT EXISTS (SELECT 1 FROM branches LIMIT 1) INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE '✅ branches table has data';
        
        -- Show count of active branches
        SELECT COUNT(*) FROM branches WHERE is_active = true INTO branch_count;
        RAISE NOTICE '  📊 Active branches count: %', branch_count;
    ELSE
        RAISE NOTICE '⚠️ branches table is empty';
    END IF;
    
    -- Check if social_links have data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'social_links') THEN
        SELECT EXISTS (SELECT 1 FROM social_links LIMIT 1) INTO table_exists;
        IF table_exists THEN
            RAISE NOTICE '✅ social_links table has data';
            
            SELECT COUNT(*) FROM social_links WHERE is_active = true INTO social_count;
            RAISE NOTICE '  📊 Active social links count: %', social_count;
        ELSE
            RAISE NOTICE '⚠️ social_links table is empty';
        END IF;
    END IF;
    
    -- Check if guest_login_logs have data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'guest_login_logs') THEN
        SELECT EXISTS (SELECT 1 FROM guest_login_logs LIMIT 1) INTO table_exists;
        IF table_exists THEN
            RAISE NOTICE '✅ guest_login_logs table has data';
            
            SELECT COUNT(*) FROM guest_login_logs INTO logs_count;
            RAISE NOTICE '  📊 Guest login logs count: %', logs_count;
        ELSE
            RAISE NOTICE '⚠️ guest_login_logs table is empty (normal for new system)';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SUMMARY:';
    RAISE NOTICE 'If you see ❌ marks, you need to run the simple_guest_schema.sql file';
    RAISE NOTICE 'If storage bucket is missing, create it in Supabase Dashboard > Storage';
    RAISE NOTICE 'Make sure the social-icons bucket is public for guest access';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Check complete!';
    
END $$;
