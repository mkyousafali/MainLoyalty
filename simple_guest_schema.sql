-- ================================================================
-- SIMPLE GUEST SYSTEM SCHEMA - ONLY ESSENTIAL TABLES
-- ================================================================
-- Version: 1.0 - MINIMAL GUEST LOGIN SYSTEM
-- Date: August 28, 2025
-- Features: Branch selection, guest tracking, social links with custom icons
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================================
-- 1. BRANCHES TABLE (Store branch details)
-- ================================================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 2. SOCIAL LINKS TABLE (Branch-specific social media links)
-- ================================================================
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT, -- Emoji icon (e.g., 📘)
    custom_icon_url TEXT, -- URL to uploaded custom PNG icon
    use_custom_icon BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 3. GUEST LOGIN LOGS TABLE (Track guest activity by branch)
-- ================================================================
CREATE TABLE IF NOT EXISTS guest_login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    session_id TEXT, -- Browser session identifier
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    login_time TIMESTAMP DEFAULT NOW(),
    logout_time TIMESTAMP,
    pages_visited JSONB DEFAULT '[]', -- Track which pages guest visited
    time_spent INTEGER DEFAULT 0, -- Time spent in minutes
    social_links_clicked JSONB DEFAULT '[]', -- Track social link interactions
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Branches indexes
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

-- Social links indexes
CREATE INDEX IF NOT EXISTS idx_social_links_branch_id ON social_links(branch_id);
CREATE INDEX IF NOT EXISTS idx_social_links_is_active ON social_links(is_active);
CREATE INDEX IF NOT EXISTS idx_social_links_sort_order ON social_links(sort_order);

-- Guest login logs indexes
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_branch_id ON guest_login_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_login_time ON guest_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_device_type ON guest_login_logs(device_type);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_branches_updated_at ON branches;
DROP TRIGGER IF EXISTS trigger_social_links_updated_at ON social_links;

-- Create updated_at triggers
CREATE TRIGGER trigger_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_social_links_updated_at 
    BEFORE UPDATE ON social_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- NO SAMPLE DATA - TABLES ARE EMPTY BY DEFAULT
-- ================================================================
-- All tables will be created empty
-- Add your own data through the admin interface

-- ================================================================
-- VIEWS FOR ANALYTICS
-- ================================================================

-- Guest analytics view
CREATE OR REPLACE VIEW guest_analytics AS
SELECT 
    b.name as branch_name,
    b.name_en,
    b.name_ar,
    COUNT(DISTINCT gl.session_id) as total_sessions,
    COUNT(DISTINCT DATE(gl.login_time)) as active_days,
    AVG(gl.time_spent) as avg_time_spent,
    COUNT(gl.id) as total_visits,
    COUNT(CASE WHEN gl.device_type = 'mobile' THEN 1 END) as mobile_visits,
    COUNT(CASE WHEN gl.device_type = 'desktop' THEN 1 END) as desktop_visits,
    MAX(gl.login_time) as last_visit
FROM branches b
LEFT JOIN guest_login_logs gl ON b.id = gl.branch_id
GROUP BY b.id, b.name, b.name_en, b.name_ar;

-- ================================================================
-- FUNCTIONS FOR GUEST TRACKING
-- ================================================================

-- Function to track guest login
CREATE OR REPLACE FUNCTION track_guest_login(
    p_branch_id UUID,
    p_session_id TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT 'desktop'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO guest_login_logs (
        branch_id, 
        session_id, 
        ip_address, 
        user_agent, 
        device_type
    )
    VALUES (
        p_branch_id, 
        p_session_id, 
        p_ip_address::INET, 
        p_user_agent, 
        p_device_type
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update guest activity
CREATE OR REPLACE FUNCTION update_guest_activity(
    p_session_id TEXT,
    p_page_visited TEXT DEFAULT NULL,
    p_social_link_clicked TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE guest_login_logs 
    SET 
        pages_visited = CASE 
            WHEN p_page_visited IS NOT NULL THEN 
                pages_visited || jsonb_build_array(jsonb_build_object(
                    'page', p_page_visited,
                    'timestamp', NOW()
                ))
            ELSE pages_visited
        END,
        social_links_clicked = CASE 
            WHEN p_social_link_clicked IS NOT NULL THEN 
                social_links_clicked || jsonb_build_array(jsonb_build_object(
                    'link', p_social_link_clicked,
                    'timestamp', NOW()
                ))
            ELSE social_links_clicked
        END,
        time_spent = EXTRACT(EPOCH FROM (NOW() - login_time))/60 -- Time in minutes
    WHERE session_id = p_session_id
    AND logout_time IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to close guest session
CREATE OR REPLACE FUNCTION close_guest_session(p_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE guest_login_logs 
    SET 
        logout_time = NOW(),
        time_spent = EXTRACT(EPOCH FROM (NOW() - login_time))/60
    WHERE session_id = p_session_id
    AND logout_time IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '🎉 SIMPLE GUEST SYSTEM - DATABASE SCHEMA CREATED!';
    RAISE NOTICE '📊 Tables Created: Only 3 essential tables';
    RAISE NOTICE '🏢 branches: Store branch details';
    RAISE NOTICE '📱 social_links: Branch-specific social media links';
    RAISE NOTICE '👥 guest_login_logs: Track guest activity by branch';
    RAISE NOTICE '🚀 Status: READY FOR PRODUCTION USE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Features:';
    RAISE NOTICE '• Branch selection before guest access';
    RAISE NOTICE '• Guest activity tracking per branch';
    RAISE NOTICE '• Social media links with custom PNG icons';
    RAISE NOTICE '• Analytics and reporting views';
END $$;
