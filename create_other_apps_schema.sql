-- ========================================
-- OTHER APPS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ========================================
-- Simple system for managing external app links in admin sidebar

-- Create other_apps table for storing app links
CREATE TABLE IF NOT EXISTS other_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon_path TEXT, -- Changed from icon_url to icon_path for uploaded files
    icon_filename TEXT, -- Store original filename
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_app_sessions table to track embedded app sessions
CREATE TABLE IF NOT EXISTS user_app_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    app_id UUID REFERENCES other_apps(id) ON DELETE CASCADE,
    session_started_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_other_apps_name ON other_apps(name);
CREATE INDEX IF NOT EXISTS idx_other_apps_category ON other_apps(category);
CREATE INDEX IF NOT EXISTS idx_other_apps_is_active ON other_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_other_apps_sort_order ON other_apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_app_sessions_admin_user_id ON user_app_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_sessions_app_id ON user_app_sessions(app_id);

-- Add updated_at trigger for other_apps
CREATE TRIGGER trigger_other_apps_updated_at 
    BEFORE UPDATE ON other_apps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample apps (optional)
INSERT INTO other_apps (name, url, description, category, sort_order) VALUES 
('Google Drive', 'https://drive.google.com', 'Cloud storage and file management', 'productivity', 1),
('WhatsApp Business', 'https://business.whatsapp.com', 'Business messaging platform', 'communication', 2),
('Canva', 'https://canva.com', 'Design and graphics creation tool', 'design', 3),
('Microsoft Teams', 'https://teams.microsoft.com', 'Team collaboration and meetings', 'communication', 4),
('Trello', 'https://trello.com', 'Project management and task organization', 'productivity', 5)
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE other_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
    -- Policy for other_apps table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'other_apps' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON other_apps FOR ALL USING (true);
    END IF;
    
    -- Policy for user_app_sessions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_app_sessions' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON user_app_sessions FOR ALL USING (true);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON other_apps TO anon, authenticated;
GRANT ALL ON user_app_sessions TO anon, authenticated;

SELECT 'Other Apps schema created successfully!' as status;
