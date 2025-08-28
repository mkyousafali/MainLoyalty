-- ================================================================
-- URBAN MARKET LOYALTY SYSTEM - COMPLETE SUPABASE SCHEMA
-- ================================================================
-- Version: 3.0 - GUEST LOGIN & SOCIAL LINKS COMPLETE SYSTEM
-- Date: August 28, 2025
-- Features: Full guest login workflow with branch-specific social links,
--          branch statistics tracking, admin management, and all existing features
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- 1. SYSTEM SETTINGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    category TEXT DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 2. ADMIN USERS & AUTHENTICATION
-- ================================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add permissions column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 3. BRANCHES TABLE (Enhanced for Guest System)
-- ================================================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    location_en TEXT,
    location_ar TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    snapchat TEXT,
    tiktok TEXT,
    website_url TEXT,
    instagram_url TEXT,
    snap_url TEXT,
    contact_phone TEXT,
    contact_number TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    opening_hours TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add phone column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'phone'
    ) THEN
        ALTER TABLE branches ADD COLUMN phone TEXT;
    END IF;
END $$;

-- ================================================================
-- 4. SOCIAL LINKS TABLE (Branch-Specific)
-- ================================================================
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT, -- Emoji icon (e.g., 📘)
    custom_icon_url TEXT, -- URL to uploaded custom icon
    use_custom_icon BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 5. GUEST LOGIN LOGS TABLE (Track guest activity)
-- ================================================================
CREATE TABLE IF NOT EXISTS guest_login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    session_id TEXT, -- Browser session identifier
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    login_time TIMESTAMP DEFAULT NOW(),
    logout_time TIMESTAMP,
    pages_visited JSONB DEFAULT '[]', -- Track which pages guest visited
    time_spent INTEGER DEFAULT 0, -- Time spent in minutes
    offers_viewed JSONB DEFAULT '[]', -- Track which offers were viewed
    social_links_clicked JSONB DEFAULT '[]', -- Track social link interactions
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 6. CUSTOMERS & LOYALTY SYSTEM
-- ================================================================

-- Card types
CREATE TABLE IF NOT EXISTS card_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    name_ar TEXT,
    color TEXT DEFAULT '#000000',
    points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    min_points_required INTEGER DEFAULT 0,
    benefits JSONB DEFAULT '{}',
    validity_months INTEGER DEFAULT 12,
    upgrade_threshold INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer numbers (eligible for registration)
CREATE TABLE IF NOT EXISTS customer_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'not_registered' CHECK (status IN ('not_registered', 'registered')),
    branch_id UUID REFERENCES branches(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Registered customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE,
    full_name TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    area TEXT,
    place TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    nationality TEXT,
    occupation TEXT,
    nearest_branch_id UUID REFERENCES branches(id),
    branch_id UUID REFERENCES branches(id),
    card_type_id UUID REFERENCES card_types(id),
    card_number TEXT,
    card_unique_code TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    visits_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP,
    card_status TEXT DEFAULT 'active' CHECK (card_status IN ('active', 'inactive', 'expired', 'suspended')),
    card_issued_at TIMESTAMP DEFAULT NOW(),
    card_expires_at TIMESTAMP,
    registration_source TEXT DEFAULT 'admin',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verification_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer transactions
CREATE TABLE IF NOT EXISTS customer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    transaction_date TIMESTAMP DEFAULT NOW(),
    branch_id UUID REFERENCES branches(id),
    receipt_number TEXT,
    transaction_type TEXT DEFAULT 'purchase',
    payment_method TEXT,
    notes TEXT,
    processed_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 7. OFFERS & ADVERTISEMENTS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS offer_advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    offer_name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    thumbnail_url TEXT,
    pdf_url TEXT,
    image_urls JSONB DEFAULT '[]',
    terms_conditions TEXT,
    discount_percentage INTEGER,
    discount_amount DECIMAL(10,2),
    minimum_purchase DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'draft')),
    category TEXT,
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 8. COUPONS & REWARDS SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_purchase DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    points_required INTEGER DEFAULT 0,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    applicable_branches JSONB DEFAULT '[]',
    applicable_categories JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Coupon redemptions tracking
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES customer_transactions(id),
    redeemed_at TIMESTAMP DEFAULT NOW(),
    discount_applied DECIMAL(10,2),
    points_used INTEGER DEFAULT 0,
    branch_id UUID REFERENCES branches(id),
    redeemed_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 9. CHECKOUT STAFF SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS checkout_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    can_redeem_coupons BOOLEAN DEFAULT TRUE,
    can_scan_qr BOOLEAN DEFAULT TRUE,
    can_search_customers BOOLEAN DEFAULT TRUE,
    can_view_history BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Checkout staff sessions
CREATE TABLE IF NOT EXISTS checkout_staff_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES checkout_staff(id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT NOW(),
    logout_time TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Checkout staff activity log
CREATE TABLE IF NOT EXISTS checkout_staff_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES checkout_staff(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'coupon_redeem', 'qr_scan', 'customer_search')),
    customer_code TEXT,
    coupon_code TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 10. OTHER APPS MANAGEMENT
-- ================================================================
CREATE TABLE IF NOT EXISTS other_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon_path TEXT,
    icon_filename TEXT,
    icon_url TEXT,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    open_in_new_tab BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- 11. ADMIN SETTINGS (For various configurations)
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text',
    category TEXT DEFAULT 'general',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE (Created after all tables are ready)
-- ================================================================

-- Branches indexes
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);

-- Social links indexes
CREATE INDEX IF NOT EXISTS idx_social_links_branch_id ON social_links(branch_id);
CREATE INDEX IF NOT EXISTS idx_social_links_is_active ON social_links(is_active);
CREATE INDEX IF NOT EXISTS idx_social_links_sort_order ON social_links(sort_order);

-- Guest login logs indexes
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_branch_id ON guest_login_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_login_time ON guest_login_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_guest_login_logs_device_type ON guest_login_logs(device_type);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points);

-- Customer transactions indexes
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_code ON customer_transactions(customer_code);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_branch_id ON customer_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_date ON customer_transactions(transaction_date);

-- Offers indexes (ensure table exists first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_advertisements') THEN
        CREATE INDEX IF NOT EXISTS idx_offer_advertisements_branch_id ON offer_advertisements(branch_id);
        CREATE INDEX IF NOT EXISTS idx_offer_advertisements_status ON offer_advertisements(status);
        CREATE INDEX IF NOT EXISTS idx_offer_advertisements_expiry ON offer_advertisements(expiry_date);
        -- Check if is_featured column exists before creating index
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'offer_advertisements' AND column_name = 'is_featured') THEN
            CREATE INDEX IF NOT EXISTS idx_offer_advertisements_featured ON offer_advertisements(is_featured);
        END IF;
    END IF;
END $$;

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- Checkout staff indexes
CREATE INDEX IF NOT EXISTS idx_checkout_staff_username ON checkout_staff(username);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_branch ON checkout_staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_active ON checkout_staff(is_active);

-- ================================================================
-- TRIGGERS (Drop existing triggers first, then recreate)
-- ================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON system_settings;
DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS trigger_branches_updated_at ON branches;
DROP TRIGGER IF EXISTS trigger_social_links_updated_at ON social_links;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_offer_advertisements_updated_at ON offer_advertisements;
DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS trigger_other_apps_updated_at ON other_apps;
DROP TRIGGER IF EXISTS trigger_admin_settings_updated_at ON admin_settings;

-- Create updated_at triggers
CREATE TRIGGER trigger_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_social_links_updated_at 
    BEFORE UPDATE ON social_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_offer_advertisements_updated_at 
    BEFORE UPDATE ON offer_advertisements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_coupons_updated_at 
    BEFORE UPDATE ON coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_other_apps_updated_at 
    BEFORE UPDATE ON other_apps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SAMPLE DATA INSERTS
-- ================================================================

-- Insert default roles (with column existence check and duplicate handling)
DO $$
BEGIN
    -- Check if permissions column exists in roles table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'permissions'
    ) THEN
        -- Insert with permissions column (skip if already exists)
        INSERT INTO roles (name, description, permissions) 
        SELECT * FROM (VALUES 
            ('Super Admin', 'Full system access', '{"all": true}'::jsonb),
            ('Branch Manager', 'Branch-specific management', '{"branches": true, "customers": true, "offers": true}'::jsonb),
            ('Staff', 'Basic operations', '{"customers": true, "transactions": true}'::jsonb)
        ) AS new_roles(name, description, permissions)
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE roles.name = new_roles.name);
    ELSE
        -- Insert without permissions column (skip if already exists)
        INSERT INTO roles (name, description) 
        SELECT * FROM (VALUES 
            ('Super Admin', 'Full system access'),
            ('Branch Manager', 'Branch-specific management'),
            ('Staff', 'Basic operations')
        ) AS new_roles(name, description)
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE roles.name = new_roles.name);
    END IF;
END $$;

-- Insert sample branches (with column existence check and duplicate handling)
DO $$
BEGIN
    -- Check if phone column exists in branches table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'phone'
    ) THEN
        -- Insert with phone column (skip if already exists)
        INSERT INTO branches (name, name_en, name_ar, address, phone, is_active) 
        SELECT * FROM (VALUES 
            ('Main Branch - Riyadh', 'Main Branch - Riyadh', 'الفرع الرئيسي - الرياض', 'King Fahd Road, Al Olaya District, Riyadh', '+966123456789', true),
            ('Branch 2 - Jeddah', 'Branch 2 - Jeddah', 'الفرع الثاني - جدة', 'Tahlia Street, Al Andalus District, Jeddah', '+966122445678', true),
            ('Branch 3 - Dammam', 'Branch 3 - Dammam', 'الفرع الثالث - الدمام', 'King Saud Road, Al Ferdous District, Dammam', '+966133234567', true)
        ) AS new_branches(name, name_en, name_ar, address, phone, is_active)
        WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branches.name = new_branches.name);
    ELSE
        -- Insert without phone column (skip if already exists)
        INSERT INTO branches (name, name_en, name_ar, address, is_active) 
        SELECT * FROM (VALUES 
            ('Main Branch - Riyadh', 'Main Branch - Riyadh', 'الفرع الرئيسي - الرياض', 'King Fahd Road, Al Olaya District, Riyadh', true),
            ('Branch 2 - Jeddah', 'Branch 2 - Jeddah', 'الفرع الثاني - جدة', 'Tahlia Street, Al Andalus District, Jeddah', true),
            ('Branch 3 - Dammam', 'Branch 3 - Dammam', 'الفرع الثالث - الدمام', 'King Saud Road, Al Ferdous District, Dammam', true)
        ) AS new_branches(name, name_en, name_ar, address, is_active)
        WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branches.name = new_branches.name);
    END IF;
END $$;

-- Insert default card types (skip if already exists)
INSERT INTO card_types (name, name_ar, color, points_multiplier, benefits, validity_months) 
SELECT * FROM (VALUES 
    ('Bronze', 'برونزي', '#CD7F32', 1.0, '{"welcome_bonus": 100}'::jsonb, 12),
    ('Silver', 'فضي', '#C0C0C0', 1.5, '{"welcome_bonus": 200, "birthday_bonus": 100}'::jsonb, 12),
    ('Gold', 'ذهبي', '#FFD700', 2.0, '{"welcome_bonus": 500, "birthday_bonus": 200, "referral_bonus": 300}'::jsonb, 24),
    ('Platinum', 'بلاتيني', '#E5E4E2', 3.0, '{"welcome_bonus": 1000, "birthday_bonus": 500, "referral_bonus": 500, "priority_support": true}'::jsonb, 24)
) AS new_card_types(name, name_ar, color, points_multiplier, benefits, validity_months)
WHERE NOT EXISTS (SELECT 1 FROM card_types WHERE card_types.name = new_card_types.name);

-- Insert sample social links for branches (skip duplicates)
DO $$
DECLARE
    branch_record RECORD;
    link_exists BOOLEAN;
BEGIN
    -- Insert social links for each branch
    FOR branch_record IN SELECT id, name FROM branches LOOP
        -- Facebook (check if exists first)
        SELECT EXISTS(SELECT 1 FROM social_links WHERE branch_id = branch_record.id AND name = 'Facebook') INTO link_exists;
        IF NOT link_exists THEN
            INSERT INTO social_links (branch_id, name, url, icon, is_active, sort_order) VALUES 
            (branch_record.id, 'Facebook', 'https://facebook.com/urbanmarket.' || LOWER(REPLACE(SPLIT_PART(branch_record.name, ' - ', 2), ' ', '')), '📘', true, 1);
        END IF;
        
        -- Instagram (check if exists first)
        SELECT EXISTS(SELECT 1 FROM social_links WHERE branch_id = branch_record.id AND name = 'Instagram') INTO link_exists;
        IF NOT link_exists THEN
            INSERT INTO social_links (branch_id, name, url, icon, is_active, sort_order) VALUES 
            (branch_record.id, 'Instagram', 'https://instagram.com/urbanmarket.' || LOWER(REPLACE(SPLIT_PART(branch_record.name, ' - ', 2), ' ', '')), '📷', true, 2);
        END IF;
        
        -- WhatsApp (check if exists first)
        SELECT EXISTS(SELECT 1 FROM social_links WHERE branch_id = branch_record.id AND name = 'WhatsApp') INTO link_exists;
        IF NOT link_exists THEN
            INSERT INTO social_links (branch_id, name, url, icon, is_active, sort_order) VALUES 
            (branch_record.id, 'WhatsApp', 'https://wa.me/966567334726', '💬', true, 3);
        END IF;
    END LOOP;
END $$;

-- Insert system settings (skip duplicates)
INSERT INTO system_settings (setting_key, setting_value, category, description) 
SELECT * FROM (VALUES 
    ('company_name', '{"en": "Urban Market", "ar": "أوربن ماركت"}'::jsonb, 'system', 'Company name in multiple languages'),
    ('company_logo_url', '{"value": "/logo.png"}'::jsonb, 'system', 'Company logo URL'),
    ('support_phone', '{"value": "+966501234567"}'::jsonb, 'system', 'Customer support phone number'),
    ('support_email', '{"value": "support@urbanmarket.com"}'::jsonb, 'system', 'Customer support email'),
    ('points_per_sar', '{"value": 1}'::jsonb, 'loyalty', 'Points earned per SAR spent'),
    ('welcome_bonus_points', '{"value": 100}'::jsonb, 'loyalty', 'Points given to new customers'),
    ('birthday_bonus_points', '{"value": 200}'::jsonb, 'loyalty', 'Points given on customer birthday'),
    ('referral_bonus_points', '{"value": 500}'::jsonb, 'loyalty', 'Points given for successful referrals'),
    ('points_expiry_months', '{"value": 24}'::jsonb, 'loyalty', 'Months after which points expire'),
    ('card_validity_months', '{"value": 12}'::jsonb, 'loyalty', 'Default card validity in months'),
    ('minimum_points_redemption', '{"value": 100}'::jsonb, 'loyalty', 'Minimum points required for redemption'),
    ('maximum_points_per_transaction', '{"value": 10000}'::jsonb, 'loyalty', 'Maximum points that can be earned per transaction')
) AS new_settings(setting_key, setting_value, category, description)
WHERE NOT EXISTS (SELECT 1 FROM system_settings WHERE system_settings.setting_key = new_settings.setting_key);

-- Insert admin settings for Google Drive integration (skip duplicates)
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) 
SELECT * FROM (VALUES 
    ('google_drive_thumbnail_folder', 'https://drive.google.com/drive/folders/your-thumbnails-folder-id', 'url', 'Google Drive folder for offer thumbnails'),
    ('google_drive_pdf_folder', 'https://drive.google.com/drive/folders/your-pdfs-folder-id', 'url', 'Google Drive folder for offer PDFs'),
    ('file_upload_max_size', '10', 'number', 'Maximum file upload size in MB'),
    ('allowed_image_types', 'jpg,jpeg,png,gif,webp', 'text', 'Allowed image file extensions'),
    ('allowed_document_types', 'pdf,doc,docx', 'text', 'Allowed document file extensions')
) AS new_admin_settings(setting_key, setting_value, setting_type, description)
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE admin_settings.setting_key = new_admin_settings.setting_key);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on sensitive tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your authentication system)
CREATE POLICY "Admin users can manage their own data" ON admin_users
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Authenticated users can read public data" ON branches
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can read active social links" ON social_links
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can read active offers" ON offer_advertisements
    FOR SELECT USING (status = 'active' AND expiry_date >= CURRENT_DATE);

-- ================================================================
-- VIEWS FOR ANALYTICS & REPORTING
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

-- Offer performance view
CREATE OR REPLACE VIEW offer_performance AS
SELECT 
    oa.id,
    oa.offer_name,
    b.name as branch_name,
    oa.start_date,
    oa.expiry_date,
    oa.status,
    COALESCE(oa.usage_count, 0) as views,
    CASE 
        WHEN oa.expiry_date < CURRENT_DATE THEN 'Expired'
        WHEN oa.expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'Expiring Soon'
        ELSE 'Active'
    END as urgency_status
FROM offer_advertisements oa
LEFT JOIN branches b ON oa.branch_id = b.id;

-- Customer loyalty summary
CREATE OR REPLACE VIEW customer_loyalty_summary AS
SELECT 
    c.id,
    c.customer_code,
    c.full_name,
    c.mobile,
    c.points,
    c.total_spent,
    c.visits_count,
    ct.name as card_type,
    b.name as branch_name,
    CASE 
        WHEN c.card_expires_at < CURRENT_DATE THEN 'Expired'
        WHEN c.card_expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Active'
    END as card_status_info
FROM customers c
LEFT JOIN card_types ct ON c.card_type_id = ct.id
LEFT JOIN branches b ON c.branch_id = b.id;

-- ================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
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
    p_offer_viewed UUID DEFAULT NULL,
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
        offers_viewed = CASE 
            WHEN p_offer_viewed IS NOT NULL THEN 
                offers_viewed || jsonb_build_array(jsonb_build_object(
                    'offer_id', p_offer_viewed,
                    'timestamp', NOW()
                ))
            ELSE offers_viewed
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
    RAISE NOTICE '🎉 URBAN MARKET LOYALTY SYSTEM - COMPLETE DATABASE SCHEMA CREATED!';
    RAISE NOTICE '📊 Tables Created: 20+ comprehensive tables';
    RAISE NOTICE '🔐 Features: Guest login system, branch-specific social links, admin management';
    RAISE NOTICE '📈 Analytics: Guest tracking, offer performance, customer loyalty views';
    RAISE NOTICE '🚀 Status: READY FOR PRODUCTION USE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Next Steps:';
    RAISE NOTICE '1. Update your Supabase environment variables in .env.local';
    RAISE NOTICE '2. Test the guest login flow: /login → /select-branch → /guest-login';
    RAISE NOTICE '3. Access admin panel: /admin/guest/manage-links & /admin/guest/branch-logs';
    RAISE NOTICE '4. Configure storage buckets for custom icon uploads (optional)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Guest System Features:';
    RAISE NOTICE '• Branch-specific social media links';
    RAISE NOTICE '• Guest activity tracking and analytics';
    RAISE NOTICE '• Custom icon uploads for social links';
    RAISE NOTICE '• Admin management interface';
    RAISE NOTICE '• Comprehensive reporting and statistics';
END $$;
