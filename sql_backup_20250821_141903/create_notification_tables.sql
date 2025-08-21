-- Fresh notification system tables for MainLoyalty
-- Drop existing tables if they exist (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS notification_recipients CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    title_en TEXT,
    title_ar TEXT,
    message TEXT NOT NULL,
    message_en TEXT,
    message_ar TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    channels TEXT[] NOT NULL DEFAULT '{}',
    recipient_type TEXT DEFAULT 'customer' CHECK (recipient_type IN ('customer', 'admin', 'all')),
    target_audience JSONB DEFAULT '{}',
    action_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_recipients table
CREATE TABLE notification_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    customer_code TEXT NOT NULL, -- Use customer_code to identify customers
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'clicked', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per notification-customer combination
    UNIQUE(notification_id, customer_code)
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_created_by ON notifications(created_by);

CREATE INDEX idx_notification_recipients_customer ON notification_recipients(customer_code);
CREATE INDEX idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_status ON notification_recipients(status);
CREATE INDEX idx_notification_recipients_read_at ON notification_recipients(read_at);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Notifications policies
-- Admins can do everything
CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
            AND admin_users.is_active = true
        )
    );

-- Customers can only read notifications sent to them
CREATE POLICY "Customers can read their notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notification_recipients nr
            JOIN customers c ON c.customer_code = nr.customer_code
            WHERE nr.notification_id = notifications.id
            AND (c.mobile = auth.jwt() ->> 'phone' OR c.customer_code = auth.jwt() ->> 'phone')
        )
    );

-- Notification recipients policies
-- Admins can manage all recipient records
CREATE POLICY "Admins can manage notification recipients" ON notification_recipients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
            AND admin_users.is_active = true
        )
    );

-- Customers can read and update their own recipient records
CREATE POLICY "Customers can manage their notification recipients" ON notification_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.customer_code = notification_recipients.customer_code
            AND (c.mobile = auth.jwt() ->> 'phone' OR c.customer_code = auth.jwt() ->> 'phone')
        )
    );

CREATE POLICY "Customers can update their notification recipients" ON notification_recipients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.customer_code = notification_recipients.customer_code
            AND (c.mobile = auth.jwt() ->> 'phone' OR c.customer_code = auth.jwt() ->> 'phone')
        )
    );

-- Insert some sample notifications for testing
INSERT INTO notifications (
    title, title_en, title_ar, 
    message, message_en, message_ar,
    type, priority, channels, status, sent_at
) VALUES 
(
    'Welcome to MainLoyalty!',
    'Welcome to MainLoyalty!',
    'مرحباً بك في ماين لويالتي!',
    'Thank you for joining our loyalty program. Start earning points today!',
    'Thank you for joining our loyalty program. Start earning points today!',
    'شكراً لانضمامك لبرنامج الولاء. ابدأ بكسب النقاط اليوم!',
    'welcome',
    'normal',
    ARRAY['app', 'email'],
    'sent',
    NOW()
),
(
    'Special Offer Available',
    'Special Offer Available', 
    'عرض خاص متاح',
    'Get 20% off your next purchase! Valid until end of month.',
    'Get 20% off your next purchase! Valid until end of month.',
    'احصل على خصم 20% على مشترياتك القادمة! ساري حتى نهاية الشهر.',
    'promotion',
    'high',
    ARRAY['app', 'sms', 'email'],
    'sent',
    NOW()
),
(
    'System Maintenance Notice',
    'System Maintenance Notice',
    'إشعار صيانة النظام', 
    'Our system will undergo maintenance tonight from 2-4 AM.',
    'Our system will undergo maintenance tonight from 2-4 AM.',
    'سيخضع نظامنا للصيانة الليلة من الساعة 2-4 صباحاً.',
    'system',
    'urgent',
    ARRAY['app'],
    'sent',
    NOW()
);

-- Display success message
SELECT 
    'Notification tables created successfully!' as message,
    'Tables: notifications, notification_recipients' as tables_created,
    'Sample notifications added for testing' as sample_data,
    'RLS policies configured for security' as security_note;
