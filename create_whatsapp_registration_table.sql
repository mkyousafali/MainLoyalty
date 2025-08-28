-- Create table for managing WhatsApp registration link in login page
CREATE TABLE IF NOT EXISTS whatsapp_registration_settings (
    id SERIAL PRIMARY KEY,
    whatsapp_link TEXT NOT NULL DEFAULT 'https://wa.me/966500000000',
    message_template_en TEXT NOT NULL DEFAULT 'Hi! I need help with loyalty program registration. Mobile number: {mobile}',
    message_template_ar TEXT NOT NULL DEFAULT 'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: {mobile}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT DEFAULT 'admin'
);

-- Insert default values
INSERT INTO whatsapp_registration_settings (
    whatsapp_link, 
    message_template_en, 
    message_template_ar,
    is_active
) VALUES (
    'https://wa.me/966500000000',
    'Hi! I need help with loyalty program registration. Mobile number: {mobile}',
    'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: {mobile}',
    true
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_registration_settings_updated_at
    BEFORE UPDATE ON whatsapp_registration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_settings_updated_at();

-- Create RLS policies for admin access
ALTER TABLE whatsapp_registration_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all settings
CREATE POLICY "Allow admin read access" ON whatsapp_registration_settings
    FOR SELECT USING (true);

-- Allow admins to insert/update settings
CREATE POLICY "Allow admin write access" ON whatsapp_registration_settings
    FOR ALL USING (true);
