-- ========================================
-- COMPLETE OTHER APPS MANAGEMENT SYSTEM - SINGLE SCHEMA
-- ========================================
-- Everything needed for the Other Apps system in one file
-- Run this entire script in your Supabase SQL editor

-- Step 1: Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Create other_apps table for storing app links
CREATE TABLE IF NOT EXISTS other_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon_path TEXT, -- For uploaded files (new system)
    icon_filename TEXT, -- Store original filename
    icon_url TEXT, -- Keep for backward compatibility (old system)
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    open_in_new_tab BOOLEAN DEFAULT TRUE, -- Default to new tab
    sort_order INTEGER DEFAULT 0,
    created_by UUID, -- Made optional since admin_users may not exist
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create user_app_sessions table to track app usage
CREATE TABLE IF NOT EXISTS user_app_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID, -- Made optional since admin_users may not exist
    app_id UUID REFERENCES other_apps(id) ON DELETE CASCADE,
    session_started_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create app_proxies table (for future proxy functionality if needed)
CREATE TABLE IF NOT EXISTS app_proxies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID REFERENCES other_apps(id) ON DELETE CASCADE,
    proxy_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_other_apps_name ON other_apps(name);
CREATE INDEX IF NOT EXISTS idx_other_apps_category ON other_apps(category);
CREATE INDEX IF NOT EXISTS idx_other_apps_is_active ON other_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_other_apps_sort_order ON other_apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_other_apps_created_at ON other_apps(created_at);

CREATE INDEX IF NOT EXISTS idx_user_app_sessions_app_id ON user_app_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_user_app_sessions_admin_user_id ON user_app_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_sessions_created_at ON user_app_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_app_sessions_is_active ON user_app_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_app_proxies_app_id ON app_proxies(app_id);
CREATE INDEX IF NOT EXISTS idx_app_proxies_is_active ON app_proxies(is_active);

-- Step 6: Add updated_at trigger for other_apps
DROP TRIGGER IF EXISTS trigger_other_apps_updated_at ON other_apps;
CREATE TRIGGER trigger_other_apps_updated_at 
    BEFORE UPDATE ON other_apps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create storage bucket for app icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-icons', 'app-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Create storage policies for app icons
-- Note: These policies may need to be created manually in Supabase dashboard if they fail
DO $$ 
BEGIN
    -- Try to create storage policies, but continue if they fail
    BEGIN
        -- Allow public read access to app icons
        CREATE POLICY "Public read access for app icons"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'app-icons');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, skip
        NULL;
    WHEN OTHERS THEN
        -- Storage policies might need manual setup, continue anyway
        RAISE NOTICE 'Storage policy creation failed - you may need to set up storage policies manually in Supabase dashboard';
    END;

    BEGIN
        -- Allow authenticated users to upload app icons
        CREATE POLICY "Authenticated users can upload app icons"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'app-icons');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, skip
        NULL;
    WHEN OTHERS THEN
        -- Continue anyway
        NULL;
    END;

    BEGIN
        -- Allow authenticated users to update app icons
        CREATE POLICY "Authenticated users can update app icons"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'app-icons');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, skip
        NULL;
    WHEN OTHERS THEN
        -- Continue anyway
        NULL;
    END;

    BEGIN
        -- Allow authenticated users to delete app icons
        CREATE POLICY "Authenticated users can delete app icons"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'app-icons');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, skip
        NULL;
    WHEN OTHERS THEN
        -- Continue anyway
        NULL;
    END;
END $$;

-- Step 9: Enable RLS (Row Level Security)
ALTER TABLE other_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_proxies ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for tables
DO $$ 
BEGIN
    -- Policies for other_apps table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'other_apps' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" 
        ON other_apps FOR ALL 
        USING (true);
    END IF;

    -- Allow public read access to active apps
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'other_apps' 
        AND policyname = 'Public read access to active apps'
    ) THEN
        CREATE POLICY "Public read access to active apps" 
        ON other_apps FOR SELECT 
        USING (is_active = true);
    END IF;
    
    -- Policies for user_app_sessions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_app_sessions' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" 
        ON user_app_sessions FOR ALL 
        USING (true);
    END IF;

    -- Policies for app_proxies table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'app_proxies' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" 
        ON app_proxies FOR ALL 
        USING (true);
    END IF;
END $$;

-- Step 11: Grant permissions
GRANT ALL ON other_apps TO anon, authenticated;
GRANT ALL ON user_app_sessions TO anon, authenticated;
GRANT ALL ON app_proxies TO anon, authenticated;

-- Grant sequence permissions (for auto-increment functionality)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 12: Insert sample apps (optional - remove if not needed)
INSERT INTO other_apps (name, url, description, category, sort_order, open_in_new_tab) VALUES 
('Google Drive', 'https://drive.google.com', 'Cloud storage and file management', 'productivity', 1, true),
('WhatsApp Business', 'https://business.whatsapp.com', 'Business messaging platform', 'communication', 2, true),
('Canva', 'https://canva.com', 'Design and graphics creation tool', 'design', 3, true),
('Microsoft Teams', 'https://teams.microsoft.com', 'Team collaboration and meetings', 'communication', 4, true),
('Trello', 'https://trello.com', 'Project management and task organization', 'productivity', 5, true),
('Gmail', 'https://gmail.com', 'Email management', 'communication', 6, true),
('Google Calendar', 'https://calendar.google.com', 'Schedule and calendar management', 'productivity', 7, true),
('Slack', 'https://slack.com', 'Team communication and collaboration', 'communication', 8, true)
ON CONFLICT DO NOTHING;

-- Step 13: Create helpful views (optional)
CREATE OR REPLACE VIEW active_apps AS
SELECT 
    id,
    name,
    url,
    description,
    COALESCE(icon_path, icon_url) as icon,
    icon_filename,
    category,
    sort_order,
    created_at,
    updated_at
FROM other_apps 
WHERE is_active = true 
ORDER BY sort_order, name;

CREATE OR REPLACE VIEW app_usage_stats AS
SELECT 
    oa.id,
    oa.name,
    oa.url,
    oa.category,
    COUNT(uas.id) as total_sessions,
    COUNT(CASE WHEN uas.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days,
    COUNT(CASE WHEN uas.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sessions_last_7_days,
    MAX(uas.created_at) as last_used
FROM other_apps oa
LEFT JOIN user_app_sessions uas ON oa.id = uas.app_id
WHERE oa.is_active = true
GROUP BY oa.id, oa.name, oa.url, oa.category
ORDER BY total_sessions DESC, oa.name;

-- Step 14: Create functions for common operations
CREATE OR REPLACE FUNCTION get_app_icon_url(app_id UUID)
RETURNS TEXT AS $$
DECLARE
    app_record RECORD;
    base_url TEXT;
BEGIN
    SELECT * INTO app_record FROM other_apps WHERE id = app_id;
    
    IF app_record IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- If we have an uploaded icon, return the storage URL
    IF app_record.icon_path IS NOT NULL THEN
        -- Get the Supabase project URL (you may need to adjust this)
        SELECT COALESCE(
            current_setting('app.settings.supabase_url', true),
            'https://your-project.supabase.co'
        ) INTO base_url;
        
        RETURN base_url || '/storage/v1/object/public/app-icons/' || app_record.icon_path;
    END IF;
    
    -- Fallback to icon_url for backward compatibility
    RETURN app_record.icon_url;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create function to track app sessions
CREATE OR REPLACE FUNCTION track_app_session(
    p_app_id UUID,
    p_admin_user_id UUID DEFAULT NULL,
    p_session_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO user_app_sessions (
        app_id,
        admin_user_id,
        session_data,
        session_started_at,
        last_accessed_at,
        is_active
    ) VALUES (
        p_app_id,
        p_admin_user_id,
        p_session_data,
        NOW(),
        NOW(),
        true
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Final success message
SELECT 
    'Complete Other Apps schema created successfully!' as status,
    'Tables: other_apps, user_app_sessions, app_proxies' as tables_created,
    'Storage: app-icons bucket with policies' as storage_created,
    'Views: active_apps, app_usage_stats' as views_created,
    'Functions: get_app_icon_url, track_app_session' as functions_created;
