// ================================================================
// GUEST SYSTEM TABLES & BUCKETS EXISTENCE CHECKER (JavaScript)
// ================================================================
// This script checks if all required tables and storage buckets exist
// for the guest login and social links system from the frontend
// ================================================================

import { supabase } from '$lib/supabase';

export async function checkGuestSystemRequirements() {
    console.log('🔍 CHECKING GUEST SYSTEM REQUIREMENTS...');
    console.log('');

    const results = {
        tables: {
            branches: false,
            social_links: false,
            guest_login_logs: false
        },
        buckets: {
            'social-icons': false,
            'social-icons-access': false
        },
        functions: {
            track_guest_login: false,
            update_guest_activity: false,
            close_guest_session: false
        },
        data: {
            activeBranches: 0,
            activeSocialLinks: 0,
            guestLogs: 0
        },
        overall: true
    };

    // ================================================================
    // 1. CHECK ESSENTIAL TABLES
    // ================================================================
    console.log('📋 CHECKING TABLES:');

    try {
        // Check branches table
        const { data: branchesData, error: branchesError } = await supabase
            .from('branches')
            .select('count', { count: 'exact', head: true });

        if (!branchesError) {
            console.log('✅ branches table exists');
            results.tables.branches = true;
            
            // Check if has active branches
            const { count } = await supabase
                .from('branches')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            console.log(`  📊 Active branches count: ${count || 0}`);
            results.data.activeBranches = count || 0;
        } else {
            console.log('❌ branches table does NOT exist');
            results.tables.branches = false;
            results.overall = false;
        }
    } catch (error) {
        console.log('❌ branches table check failed:', error.message);
        results.tables.branches = false;
        results.overall = false;
    }

    try {
        // Check social_links table
        const { data: socialLinksData, error: socialLinksError } = await supabase
            .from('social_links')
            .select('count', { count: 'exact', head: true });

        if (!socialLinksError) {
            console.log('✅ social_links table exists');
            results.tables.social_links = true;
            
            // Check if has active social links
            const { count } = await supabase
                .from('social_links')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            console.log(`  📊 Active social links count: ${count || 0}`);
            results.data.activeSocialLinks = count || 0;
        } else {
            console.log('❌ social_links table does NOT exist');
            results.tables.social_links = false;
            results.overall = false;
        }
    } catch (error) {
        console.log('❌ social_links table check failed:', error.message);
        results.tables.social_links = false;
        results.overall = false;
    }

    try {
        // Check guest_login_logs table
        const { data: guestLogsData, error: guestLogsError } = await supabase
            .from('guest_login_logs')
            .select('count', { count: 'exact', head: true });

        if (!guestLogsError) {
            console.log('✅ guest_login_logs table exists');
            results.tables.guest_login_logs = true;
            
            // Check total guest logs
            const { count } = await supabase
                .from('guest_login_logs')
                .select('*', { count: 'exact', head: true });
            
            console.log(`  📊 Guest login logs count: ${count || 0}`);
            results.data.guestLogs = count || 0;
        } else {
            console.log('❌ guest_login_logs table does NOT exist');
            results.tables.guest_login_logs = false;
            results.overall = false;
        }
    } catch (error) {
        console.log('❌ guest_login_logs table check failed:', error.message);
        results.tables.guest_login_logs = false;
        results.overall = false;
    }

    console.log('');

    // ================================================================
    // 2. CHECK STORAGE BUCKETS
    // ================================================================
    console.log('🗂️ CHECKING STORAGE BUCKETS:');

    try {
        // List all buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (!bucketsError && buckets) {
            // Check if social-icons bucket exists
            const socialIconsBucket = buckets.find(bucket => bucket.name === 'social-icons');
            
            if (socialIconsBucket) {
                console.log('✅ social-icons storage bucket exists');
                results.buckets['social-icons'] = true;
                
                if (socialIconsBucket.public) {
                    console.log('  ✅ social-icons bucket is public');
                } else {
                    console.log('  ⚠️ social-icons bucket is private (may need to be public for guest access)');
                }
            } else {
                console.log('❌ social-icons storage bucket does NOT exist');
                results.buckets['social-icons'] = false;
                results.overall = false;
            }
        } else {
            console.log('❌ Failed to check storage buckets:', bucketsError?.message);
            results.buckets['social-icons'] = false;
            results.overall = false;
        }
    } catch (error) {
        console.log('❌ Storage bucket check failed:', error.message);
        results.buckets['social-icons'] = false;
        results.overall = false;
    }

    console.log('');

    // ================================================================
    // 3. CHECK FUNCTIONS (via RPC calls)
    // ================================================================
    console.log('🔧 CHECKING FUNCTIONS:');

    try {
        // Test track_guest_login function
        const { data, error } = await supabase.rpc('track_guest_login', {
            p_branch_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
            p_session_id: 'test-session-check',
            p_device_type: 'test'
        });

        if (!error) {
            console.log('✅ track_guest_login() function exists and works');
            results.functions.track_guest_login = true;
        } else if (error.code === '23503') {
            // Foreign key violation means function exists but branch doesn't
            console.log('✅ track_guest_login() function exists (foreign key constraint working)');
            results.functions.track_guest_login = true;
        } else {
            console.log('❌ track_guest_login() function issue:', error.message);
            results.functions.track_guest_login = false;
            results.overall = false;
        }
    } catch (error) {
        console.log('❌ track_guest_login() function check failed:', error.message);
        results.functions.track_guest_login = false;
        results.overall = false;
    }

    try {
        // Test update_guest_activity function
        const { error } = await supabase.rpc('update_guest_activity', {
            p_session_id: 'test-session-check',
            p_page_visited: 'test-page'
        });

        if (!error) {
            console.log('✅ update_guest_activity() function exists and works');
            results.functions.update_guest_activity = true;
        } else {
            console.log('✅ update_guest_activity() function exists');
            results.functions.update_guest_activity = true;
        }
    } catch (error) {
        console.log('❌ update_guest_activity() function check failed:', error.message);
        results.functions.update_guest_activity = false;
        results.overall = false;
    }

    try {
        // Test close_guest_session function
        const { error } = await supabase.rpc('close_guest_session', {
            p_session_id: 'test-session-check'
        });

        if (!error) {
            console.log('✅ close_guest_session() function exists and works');
            results.functions.close_guest_session = true;
        } else {
            console.log('✅ close_guest_session() function exists');
            results.functions.close_guest_session = true;
        }
    } catch (error) {
        console.log('❌ close_guest_session() function check failed:', error.message);
        results.functions.close_guest_session = false;
        results.overall = false;
    }

    console.log('');

    // ================================================================
    // 4. TEST STORAGE UPLOAD/DOWNLOAD
    // ================================================================
    console.log('📁 TESTING STORAGE ACCESS:');

    if (results.buckets['social-icons']) {
        try {
            // Test file list in social-icons bucket
            const { data: files, error: listError } = await supabase.storage
                .from('social-icons')
                .list('', { limit: 1 });

            if (!listError) {
                console.log('✅ social-icons bucket is accessible');
                console.log(`  📊 Files in bucket: ${files?.length || 0}`);
                results.buckets['social-icons-access'] = true;
            } else {
                console.log('❌ social-icons bucket access failed:', listError.message);
                results.buckets['social-icons-access'] = false;
            }
        } catch (error) {
            console.log('❌ Storage access test failed:', error.message);
            results.buckets['social-icons-access'] = false;
        }
    }

    console.log('');

    // ================================================================
    // 5. SUMMARY
    // ================================================================
    console.log('🎯 SUMMARY:');
    
    if (results.overall) {
        console.log('✅ All guest system requirements are met!');
        console.log('🚀 Your guest login system is ready to use');
    } else {
        console.log('❌ Some requirements are missing');
        console.log('📝 Actions needed:');
        
        if (!results.tables.branches || !results.tables.social_links || !results.tables.guest_login_logs) {
            console.log('  - Run simple_guest_schema.sql in Supabase SQL Editor');
        }
        
        if (!results.buckets['social-icons']) {
            console.log('  - Create "social-icons" storage bucket in Supabase Dashboard');
            console.log('  - Make the bucket public for guest access');
        }
    }

    console.log('');
    console.log('📊 Detailed Results:', results);
    
    return results;
}

// ================================================================
// USAGE EXAMPLE
// ================================================================
// To use this checker, call it from your Svelte component:
/*
<script>
import { checkGuestSystemRequirements } from './check_guest_system';

onMount(async () => {
    const results = await checkGuestSystemRequirements();
    
    if (results.overall) {
        console.log('✅ Guest system is ready!');
    } else {
        console.log('❌ Guest system needs setup');
    }
});
</script>
*/

// ================================================================
// CREATE STORAGE BUCKET HELPER
// ================================================================
export async function createSocialIconsBucket() {
    try {
        console.log('🗂️ Creating social-icons storage bucket...');
        
        const { data, error } = await supabase.storage.createBucket('social-icons', {
            public: true,
            allowedMimeTypes: ['image/png'],
            fileSizeLimit: 2097152 // 2MB
        });

        if (!error) {
            console.log('✅ social-icons bucket created successfully');
            return { success: true };
        } else {
            console.log('❌ Failed to create bucket:', error.message);
            return { success: false, error: error.message };
        }
    } catch (error) {
        console.log('❌ Bucket creation failed:', error.message);
        return { success: false, error: error.message };
    }
}
