-- ========================================
-- LUCKY DRAW SYSTEM - COMPREHENSIVE SCHEMA
-- ========================================
-- Full database schema for Lucky Draw functionality
-- Features: Variable spin wheel, secure outcomes, prizes, campaigns, staff interface

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- CORE TABLES
-- ========================================

-- 1. Lucky Draw Categories (Prize Categories)
CREATE TABLE IF NOT EXISTS lucky_draw_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    image_en TEXT, -- Image for English
    image_ar TEXT, -- Image for Arabic
    color TEXT DEFAULT '#3B82F6', -- Brand color for the category
    rank INTEGER DEFAULT 0, -- Lower rank = higher priority (1 = highest)
    is_bumper BOOLEAN DEFAULT FALSE, -- Special bumper prize category
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Lucky Draw Coupons Pool
CREATE TABLE IF NOT EXISTS lucky_draw_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_code TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES lucky_draw_categories(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'redeemed', 'expired')),
    batch_id UUID, -- For tracking upload batches
    reserved_at TIMESTAMP,
    redeemed_at TIMESTAMP,
    expired_at TIMESTAMP,
    customer_card_number TEXT, -- Card number that won this coupon
    redeemed_by TEXT, -- Staff member who processed redemption
    redeemed_branch_id UUID, -- Branch where redeemed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Lucky Draw Rules & Settings
CREATE TABLE IF NOT EXISTS lucky_draw_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_type TEXT NOT NULL, -- gold, silver, bronze
    win_chance_percent INTEGER DEFAULT 50 CHECK (win_chance_percent >= 0 AND win_chance_percent <= 100),
    cooldown_days INTEGER DEFAULT 7,
    daily_spin_cap INTEGER DEFAULT 1,
    weekly_spin_cap INTEGER DEFAULT 3,
    points_cost INTEGER DEFAULT 0,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    purchase_lookback_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Customer Spins History
CREATE TABLE IF NOT EXISTS lucky_draw_spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    card_type TEXT NOT NULL,
    spin_result TEXT NOT NULL CHECK (spin_result IN ('win', 'no_luck', 'no_stock')),
    category_won_id UUID REFERENCES lucky_draw_categories(id) ON DELETE SET NULL,
    coupon_won_id UUID REFERENCES lucky_draw_coupons(id) ON DELETE SET NULL,
    points_spent INTEGER DEFAULT 0,
    spin_data JSONB DEFAULT '{}', -- Store additional spin metadata
    spun_at TIMESTAMP DEFAULT NOW(),
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Customer Prize History (Detailed tracking)
CREATE TABLE IF NOT EXISTS lucky_draw_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    spin_id UUID REFERENCES lucky_draw_spins(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES lucky_draw_coupons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES lucky_draw_categories(id) ON DELETE SET NULL,
    
    -- Prize details
    prize_amount DECIMAL(10,2) NOT NULL,
    coupon_code TEXT NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    expires_at TIMESTAMP NOT NULL, -- 24 hours from win
    
    -- QR Code details
    qr_code_data TEXT, -- Dynamic QR data
    qr_last_refreshed TIMESTAMP DEFAULT NOW(),
    
    -- Redemption details
    redeemed_at TIMESTAMP,
    redeemed_by TEXT, -- Staff member
    redeemed_branch_id UUID,
    redemption_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Spin Credits System
CREATE TABLE IF NOT EXISTS lucky_draw_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('purchase', 'points', 'gift', 'weekly', 'first_time')),
    credits_earned INTEGER DEFAULT 1,
    credits_used INTEGER DEFAULT 0,
    reason TEXT,
    purchase_amount DECIMAL(10,2), -- If earned from purchase
    points_spent INTEGER, -- If earned from points
    
    -- Admin gift details
    gifted_by TEXT, -- Admin who gifted
    gift_reason TEXT,
    
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Lucky Draw Campaigns
CREATE TABLE IF NOT EXISTS lucky_draw_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    
    -- Campaign timing
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    
    -- Special settings for campaign
    special_categories JSONB DEFAULT '[]', -- Special categories for this campaign
    special_odds JSONB DEFAULT '{}', -- Modified odds during campaign
    bumper_prizes_only BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. System Controls & Blocklist
CREATE TABLE IF NOT EXISTS lucky_draw_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_type TEXT NOT NULL CHECK (control_type IN ('global_pause', 'card_pause', 'card_block')),
    target_value TEXT, -- Card number if specific card control
    is_active BOOLEAN DEFAULT TRUE,
    reason TEXT,
    created_by TEXT, -- Admin who created the control
    expires_at TIMESTAMP, -- Optional expiry
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Notifications Queue
CREATE TABLE IF NOT EXISTS lucky_draw_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    prize_id UUID REFERENCES lucky_draw_prizes(id) ON DELETE CASCADE,
    notification_type TEXT DEFAULT 'prize_expiring' CHECK (notification_type IN ('prize_expiring', 'prize_won', 'prize_expired')),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    message TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    
    -- Delivery tracking
    sent_at TIMESTAMP,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Staff Checkout Interface Tracking
CREATE TABLE IF NOT EXISTS lucky_draw_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prize_id UUID REFERENCES lucky_draw_prizes(id) ON DELETE CASCADE,
    customer_code TEXT NOT NULL,
    coupon_code TEXT NOT NULL,
    
    -- Staff & branch details
    staff_username TEXT NOT NULL,
    branch_id UUID,
    
    -- Redemption details
    qr_scanned BOOLEAN DEFAULT FALSE,
    manual_entry BOOLEAN DEFAULT FALSE,
    redemption_notes TEXT,
    
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_categories_rank ON lucky_draw_categories(rank);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_categories_is_active ON lucky_draw_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_categories_is_bumper ON lucky_draw_categories(is_bumper);

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_coupons_code ON lucky_draw_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_coupons_status ON lucky_draw_coupons(status);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_coupons_category ON lucky_draw_coupons(category_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_coupons_batch ON lucky_draw_coupons(batch_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_coupons_customer ON lucky_draw_coupons(customer_card_number);

-- Rules indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_rules_card_type ON lucky_draw_rules(card_type);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_rules_is_active ON lucky_draw_rules(is_active);

-- Spins indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_spins_customer ON lucky_draw_spins(customer_code);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_spins_date ON lucky_draw_spins(spun_at);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_spins_result ON lucky_draw_spins(spin_result);

-- Prizes indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_prizes_customer ON lucky_draw_prizes(customer_code);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_prizes_status ON lucky_draw_prizes(status);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_prizes_expires ON lucky_draw_prizes(expires_at);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_prizes_created ON lucky_draw_prizes(created_at);

-- Credits indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_credits_customer ON lucky_draw_credits(customer_code);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_credits_type ON lucky_draw_credits(credit_type);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_credits_active ON lucky_draw_credits(is_active);

-- Controls indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_controls_type ON lucky_draw_controls(control_type);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_controls_target ON lucky_draw_controls(target_value);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_controls_active ON lucky_draw_controls(is_active);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_notifications_customer ON lucky_draw_notifications(customer_code);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_notifications_status ON lucky_draw_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_notifications_type ON lucky_draw_notifications(notification_type);

-- ========================================
-- UPDATED_AT TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS trigger_lucky_draw_categories_updated_at ON lucky_draw_categories;
CREATE TRIGGER trigger_lucky_draw_categories_updated_at 
    BEFORE UPDATE ON lucky_draw_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_lucky_draw_coupons_updated_at ON lucky_draw_coupons;
CREATE TRIGGER trigger_lucky_draw_coupons_updated_at 
    BEFORE UPDATE ON lucky_draw_coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_lucky_draw_rules_updated_at ON lucky_draw_rules;
CREATE TRIGGER trigger_lucky_draw_rules_updated_at 
    BEFORE UPDATE ON lucky_draw_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_lucky_draw_prizes_updated_at ON lucky_draw_prizes;
CREATE TRIGGER trigger_lucky_draw_prizes_updated_at 
    BEFORE UPDATE ON lucky_draw_prizes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_lucky_draw_campaigns_updated_at ON lucky_draw_campaigns;
CREATE TRIGGER trigger_lucky_draw_campaigns_updated_at 
    BEFORE UPDATE ON lucky_draw_campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE lucky_draw_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all for now - customize based on your auth system)
DO $$ 
BEGIN
    -- Categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_categories' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_categories FOR ALL USING (true);
    END IF;
    
    -- Coupons policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_coupons' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_coupons FOR ALL USING (true);
    END IF;
    
    -- Rules policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_rules' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_rules FOR ALL USING (true);
    END IF;
    
    -- Spins policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_spins' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_spins FOR ALL USING (true);
    END IF;
    
    -- Prizes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_prizes' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_prizes FOR ALL USING (true);
    END IF;
    
    -- Credits policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_credits' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_credits FOR ALL USING (true);
    END IF;
    
    -- Campaigns policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_campaigns' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_campaigns FOR ALL USING (true);
    END IF;
    
    -- Controls policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_controls' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_controls FOR ALL USING (true);
    END IF;
    
    -- Notifications policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_notifications' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_notifications FOR ALL USING (true);
    END IF;
    
    -- Redemptions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lucky_draw_redemptions' AND policyname = 'Enable all operations for authenticated users') THEN
        CREATE POLICY "Enable all operations for authenticated users" ON lucky_draw_redemptions FOR ALL USING (true);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON lucky_draw_categories TO anon, authenticated;
GRANT ALL ON lucky_draw_coupons TO anon, authenticated;
GRANT ALL ON lucky_draw_rules TO anon, authenticated;
GRANT ALL ON lucky_draw_spins TO anon, authenticated;
GRANT ALL ON lucky_draw_prizes TO anon, authenticated;
GRANT ALL ON lucky_draw_credits TO anon, authenticated;
GRANT ALL ON lucky_draw_campaigns TO anon, authenticated;
GRANT ALL ON lucky_draw_controls TO anon, authenticated;
GRANT ALL ON lucky_draw_notifications TO anon, authenticated;
GRANT ALL ON lucky_draw_redemptions TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ========================================
-- INITIAL DATA SETUP
-- ========================================

-- Default card type rules
INSERT INTO lucky_draw_rules (card_type, win_chance_percent, cooldown_days, daily_spin_cap, weekly_spin_cap, points_cost) VALUES 
('gold', 70, 3, 2, 5, 100),
('silver', 60, 5, 1, 3, 150),
('bronze', 50, 7, 1, 2, 200)
ON CONFLICT DO NOTHING;

-- Sample categories
INSERT INTO lucky_draw_categories (name, name_ar, description, description_ar, rank, color) VALUES 
('Small Prize', 'جائزة صغيرة', 'Small monetary prizes', 'جوائز نقدية صغيرة', 3, '#10B981'),
('Medium Prize', 'جائزة متوسطة', 'Medium monetary prizes', 'جوائز نقدية متوسطة', 2, '#F59E0B'),
('Big Prize', 'جائزة كبيرة', 'Big monetary prizes', 'جوائز نقدية كبيرة', 1, '#EF4444'),
('Mega Prize', 'الجائزة الكبرى', 'Special mega prizes', 'جوائز كبرى خاصة', 0, '#8B5CF6')
ON CONFLICT DO NOTHING;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check if customer can spin
CREATE OR REPLACE FUNCTION can_customer_spin(
    p_customer_code TEXT,
    p_card_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_rules lucky_draw_rules%ROWTYPE;
    v_last_spin_date DATE;
    v_daily_spins INTEGER;
    v_weekly_spins INTEGER;
    v_cooldown_ok BOOLEAN;
    v_daily_cap_ok BOOLEAN;
    v_weekly_cap_ok BOOLEAN;
    v_global_paused BOOLEAN;
    v_card_blocked BOOLEAN;
    v_result JSONB;
BEGIN
    -- Get rules for card type
    SELECT * INTO v_rules FROM lucky_draw_rules WHERE card_type = p_card_type AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('can_spin', false, 'reason', 'no_rules', 'message', 'No rules found for card type');
    END IF;
    
    -- Check global pause
    SELECT EXISTS(
        SELECT 1 FROM lucky_draw_controls 
        WHERE control_type = 'global_pause' AND is_active = true
    ) INTO v_global_paused;
    
    IF v_global_paused THEN
        RETURN jsonb_build_object('can_spin', false, 'reason', 'global_pause', 'message', 'Lucky draw is temporarily paused');
    END IF;
    
    -- Check card specific block
    SELECT EXISTS(
        SELECT 1 FROM lucky_draw_controls 
        WHERE control_type IN ('card_pause', 'card_block') 
        AND target_value = p_customer_code 
        AND is_active = true
    ) INTO v_card_blocked;
    
    IF v_card_blocked THEN
        RETURN jsonb_build_object('can_spin', false, 'reason', 'card_blocked', 'message', 'Your card is temporarily blocked from lucky draw');
    END IF;
    
    -- Check cooldown
    SELECT MAX(spun_at::DATE) INTO v_last_spin_date 
    FROM lucky_draw_spins 
    WHERE customer_code = p_customer_code;
    
    IF v_last_spin_date IS NOT NULL THEN
        v_cooldown_ok := (CURRENT_DATE - v_last_spin_date) >= v_rules.cooldown_days;
    ELSE
        v_cooldown_ok := true; -- First time spinner
    END IF;
    
    -- Check daily cap
    SELECT COUNT(*) INTO v_daily_spins 
    FROM lucky_draw_spins 
    WHERE customer_code = p_customer_code 
    AND spun_at::DATE = CURRENT_DATE;
    
    v_daily_cap_ok := v_daily_spins < v_rules.daily_spin_cap;
    
    -- Check weekly cap
    SELECT COUNT(*) INTO v_weekly_spins 
    FROM lucky_draw_spins 
    WHERE customer_code = p_customer_code 
    AND spun_at >= (CURRENT_DATE - INTERVAL '7 days');
    
    v_weekly_cap_ok := v_weekly_spins < v_rules.weekly_spin_cap;
    
    -- Build result
    IF v_cooldown_ok AND v_daily_cap_ok AND v_weekly_cap_ok THEN
        v_result := jsonb_build_object(
            'can_spin', true,
            'reason', 'ok',
            'message', 'Ready to spin!'
        );
    ELSE
        v_result := jsonb_build_object(
            'can_spin', false,
            'reason', 'limits',
            'cooldown_ok', v_cooldown_ok,
            'daily_cap_ok', v_daily_cap_ok,
            'weekly_cap_ok', v_weekly_cap_ok,
            'next_spin_date', CASE 
                WHEN NOT v_cooldown_ok THEN (v_last_spin_date + v_rules.cooldown_days)::TEXT
                ELSE CURRENT_DATE::TEXT
            END
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to execute spin
CREATE OR REPLACE FUNCTION execute_lucky_spin(
    p_customer_code TEXT,
    p_card_type TEXT,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_can_spin JSONB;
    v_rules lucky_draw_rules%ROWTYPE;
    v_win_roll INTEGER;
    v_won BOOLEAN;
    v_category lucky_draw_categories%ROWTYPE;
    v_coupon lucky_draw_coupons%ROWTYPE;
    v_spin_id UUID;
    v_prize_id UUID;
    v_result JSONB;
    v_is_first_time BOOLEAN;
BEGIN
    -- Check if can spin
    v_can_spin := can_customer_spin(p_customer_code, p_card_type);
    
    IF NOT (v_can_spin->>'can_spin')::BOOLEAN THEN
        RETURN v_can_spin;
    END IF;
    
    -- Get rules
    SELECT * INTO v_rules FROM lucky_draw_rules WHERE card_type = p_card_type AND is_active = true;
    
    -- Check if first time spinner
    SELECT NOT EXISTS(
        SELECT 1 FROM lucky_draw_spins WHERE customer_code = p_customer_code
    ) INTO v_is_first_time;
    
    -- Generate random number (1-100)
    v_win_roll := floor(random() * 100) + 1;
    
    -- Determine if won (first time spinners must win lowest category)
    IF v_is_first_time THEN
        v_won := true;
    ELSE
        v_won := v_win_roll <= v_rules.win_chance_percent;
    END IF;
    
    -- Record the spin
    INSERT INTO lucky_draw_spins (customer_code, card_type, spin_result, points_spent, ip_address)
    VALUES (p_customer_code, p_card_type, 
            CASE WHEN v_won THEN 'win' ELSE 'no_luck' END, 
            v_rules.points_cost, p_ip_address)
    RETURNING id INTO v_spin_id;
    
    -- If won, assign a prize
    IF v_won THEN
        -- Get appropriate category (lowest rank for first-time, random for others)
        IF v_is_first_time THEN
            -- Get lowest category (highest rank number)
            SELECT * INTO v_category 
            FROM lucky_draw_categories 
            WHERE is_active = true 
            ORDER BY rank DESC 
            LIMIT 1;
        ELSE
            -- Get random category weighted by availability
            SELECT * INTO v_category 
            FROM lucky_draw_categories 
            WHERE is_active = true 
            ORDER BY random() 
            LIMIT 1;
        END IF;
        
        -- Try to get available coupon from this category
        SELECT * INTO v_coupon 
        FROM lucky_draw_coupons 
        WHERE category_id = v_category.id 
        AND status = 'available' 
        ORDER BY random() 
        LIMIT 1;
        
        IF FOUND THEN
            -- Reserve the coupon
            UPDATE lucky_draw_coupons 
            SET status = 'reserved',
                reserved_at = NOW(),
                customer_card_number = p_customer_code
            WHERE id = v_coupon.id;
            
            -- Create prize entry
            INSERT INTO lucky_draw_prizes (
                customer_code, spin_id, coupon_id, category_id,
                prize_amount, coupon_code, expires_at
            ) VALUES (
                p_customer_code, v_spin_id, v_coupon.id, v_category.id,
                v_coupon.amount, v_coupon.coupon_code, NOW() + INTERVAL '24 hours'
            ) RETURNING id INTO v_prize_id;
            
            -- Update spin record
            UPDATE lucky_draw_spins 
            SET category_won_id = v_category.id, coupon_won_id = v_coupon.id
            WHERE id = v_spin_id;
            
            v_result := jsonb_build_object(
                'success', true,
                'result', 'win',
                'prize', jsonb_build_object(
                    'id', v_prize_id,
                    'category', v_category.name,
                    'category_ar', v_category.name_ar,
                    'amount', v_coupon.amount,
                    'coupon_code', v_coupon.coupon_code,
                    'expires_at', (NOW() + INTERVAL '24 hours')::TEXT
                )
            );
        ELSE
            -- No stock available, update spin to no_stock
            UPDATE lucky_draw_spins SET spin_result = 'no_stock' WHERE id = v_spin_id;
            
            v_result := jsonb_build_object(
                'success', true,
                'result', 'no_stock',
                'message', 'Better luck next time!'
            );
        END IF;
    ELSE
        v_result := jsonb_build_object(
            'success', true,
            'result', 'no_luck',
            'message', 'Better luck next time!'
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate dynamic QR code data
CREATE OR REPLACE FUNCTION generate_qr_data(
    p_prize_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_prize lucky_draw_prizes%ROWTYPE;
    v_timestamp TEXT;
    v_qr_data TEXT;
BEGIN
    SELECT * INTO v_prize FROM lucky_draw_prizes WHERE id = p_prize_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Generate timestamp-based QR data
    v_timestamp := EXTRACT(EPOCH FROM NOW())::TEXT;
    v_qr_data := format('LUCKY:%s:%s:%s:%s', 
                       v_prize.coupon_code, 
                       v_prize.customer_code,
                       v_prize.prize_amount,
                       v_timestamp);
    
    -- Update last refreshed time
    UPDATE lucky_draw_prizes 
    SET qr_code_data = v_qr_data, qr_last_refreshed = NOW()
    WHERE id = p_prize_id;
    
    RETURN v_qr_data;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire prizes function
CREATE OR REPLACE FUNCTION auto_expire_prizes()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    -- Move expired prizes back to pool
    WITH expired_prizes AS (
        UPDATE lucky_draw_prizes 
        SET status = 'expired'
        WHERE status = 'active' 
        AND expires_at < NOW()
        RETURNING coupon_id
    )
    UPDATE lucky_draw_coupons 
    SET status = 'available',
        reserved_at = NULL,
        customer_card_number = NULL
    WHERE id IN (SELECT coupon_id FROM expired_prizes);
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HELPFUL VIEWS
-- ========================================

-- Active prizes view
CREATE OR REPLACE VIEW customer_active_prizes AS
SELECT 
    p.*,
    c.name as category_name,
    c.name_ar as category_name_ar,
    EXTRACT(EPOCH FROM (p.expires_at - NOW()))::INTEGER as seconds_remaining
FROM lucky_draw_prizes p
JOIN lucky_draw_categories c ON p.category_id = c.id
WHERE p.status = 'active'
AND p.expires_at > NOW();

-- Winners leaderboard view
CREATE OR REPLACE VIEW lucky_draw_leaderboard AS
SELECT 
    SUBSTRING(s.customer_code FROM 1 FOR LENGTH(s.customer_code) - 4) || 'XXXX' as masked_customer,
    COUNT(*) as total_wins,
    SUM(p.prize_amount) as total_amount_won,
    MAX(s.spun_at) as last_win_date
FROM lucky_draw_spins s
JOIN lucky_draw_prizes p ON s.id = p.spin_id
WHERE s.spin_result = 'win'
AND s.spun_at >= (CURRENT_DATE - INTERVAL '7 days')
GROUP BY s.customer_code
ORDER BY total_amount_won DESC, total_wins DESC;

-- System statistics view
CREATE OR REPLACE VIEW lucky_draw_stats AS
SELECT 
    COUNT(*) FILTER (WHERE spun_at::DATE = CURRENT_DATE) as spins_today,
    COUNT(*) FILTER (WHERE spun_at >= (CURRENT_DATE - INTERVAL '7 days')) as spins_this_week,
    COUNT(*) FILTER (WHERE spin_result = 'win' AND spun_at::DATE = CURRENT_DATE) as wins_today,
    COUNT(*) FILTER (WHERE spin_result = 'win' AND spun_at >= (CURRENT_DATE - INTERVAL '7 days')) as wins_this_week,
    COUNT(*) as total_spins,
    COUNT(*) FILTER (WHERE spin_result = 'win') as total_wins,
    ROUND((COUNT(*) FILTER (WHERE spin_result = 'win')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as overall_win_rate
FROM lucky_draw_spins;

-- Final success message
SELECT 
    '🎯 Lucky Draw System Schema Created Successfully!' as status,
    '10 main tables + helper functions + views created' as summary,
    'Ready for frontend integration' as next_step;
