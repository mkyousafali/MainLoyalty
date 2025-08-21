-- ========================================
-- CHECKOUT STAFF SYSTEM SCHEMA
-- ========================================
-- Separate staff system for checkout operations
-- Accessed by clicking "Customer Login" card 10 times

-- Create checkout staff users table
CREATE TABLE IF NOT EXISTS checkout_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- In production, hash this properly
    full_name TEXT NOT NULL,
    phone TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    
    -- Permissions
    can_redeem_coupons BOOLEAN DEFAULT TRUE,
    can_scan_qr BOOLEAN DEFAULT TRUE,
    can_search_customers BOOLEAN DEFAULT TRUE,
    can_view_history BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    
    created_by TEXT, -- Admin who created this staff
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create checkout staff sessions table
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

-- Create staff activity log
CREATE TABLE IF NOT EXISTS checkout_staff_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES checkout_staff(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'coupon_redeem', 'qr_scan', 'customer_search')),
    customer_code TEXT, -- If activity involves a customer
    coupon_code TEXT, -- If activity involves a coupon
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkout_staff_username ON checkout_staff(username);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_branch ON checkout_staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_active ON checkout_staff(is_active);

CREATE INDEX IF NOT EXISTS idx_checkout_staff_sessions_staff ON checkout_staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_sessions_active ON checkout_staff_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_checkout_staff_activity_staff ON checkout_staff_activity(staff_id);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_activity_type ON checkout_staff_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_checkout_staff_activity_date ON checkout_staff_activity(created_at);

-- Triggers
DROP TRIGGER IF EXISTS trigger_checkout_staff_updated_at ON checkout_staff;
CREATE TRIGGER trigger_checkout_staff_updated_at 
    BEFORE UPDATE ON checkout_staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE checkout_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_staff_activity ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_staff' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON checkout_staff FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_staff_sessions' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON checkout_staff_sessions FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checkout_staff_activity' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON checkout_staff_activity FOR ALL USING (true);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON checkout_staff TO anon, authenticated;
GRANT ALL ON checkout_staff_sessions TO anon, authenticated;
GRANT ALL ON checkout_staff_activity TO anon, authenticated;

-- Sample staff user (for testing)
INSERT INTO checkout_staff (username, password_hash, full_name, phone, can_redeem_coupons, can_scan_qr, can_search_customers)
VALUES ('cashier01', 'cashier123', 'Test Cashier', '1234567890', true, true, true)
ON CONFLICT (username) DO NOTHING;

-- Function to authenticate staff
CREATE OR REPLACE FUNCTION authenticate_checkout_staff(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_staff checkout_staff%ROWTYPE;
    v_session_id UUID;
BEGIN
    SELECT * INTO v_staff 
    FROM checkout_staff 
    WHERE username = p_username 
    AND password_hash = p_password 
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    -- Update last login
    UPDATE checkout_staff SET last_login = NOW() WHERE id = v_staff.id;
    
    -- Create session
    INSERT INTO checkout_staff_sessions (staff_id)
    VALUES (v_staff.id)
    RETURNING id INTO v_session_id;
    
    -- Log activity
    INSERT INTO checkout_staff_activity (staff_id, activity_type)
    VALUES (v_staff.id, 'login');
    
    RETURN jsonb_build_object(
        'success', true,
        'staff', jsonb_build_object(
            'id', v_staff.id,
            'username', v_staff.username,
            'full_name', v_staff.full_name,
            'branch_id', v_staff.branch_id,
            'permissions', jsonb_build_object(
                'can_redeem_coupons', v_staff.can_redeem_coupons,
                'can_scan_qr', v_staff.can_scan_qr,
                'can_search_customers', v_staff.can_search_customers,
                'can_view_history', v_staff.can_view_history
            )
        ),
        'session_id', v_session_id
    );
END;
$$ LANGUAGE plpgsql;

SELECT 'Checkout Staff System Schema Created Successfully!' as status;
