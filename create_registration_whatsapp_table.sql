-- Create table for storing global registration WhatsApp link
CREATE TABLE IF NOT EXISTS global_registration_settings (
    id SERIAL PRIMARY KEY,
    whatsapp_registration_link TEXT NOT NULL DEFAULT 'https://wa.me/966500000000',
    registration_message_en TEXT DEFAULT 'Hi! I need help with loyalty program registration.',
    registration_message_ar TEXT DEFAULT 'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values
INSERT INTO global_registration_settings (whatsapp_registration_link, registration_message_en, registration_message_ar)
VALUES (
    'https://wa.me/966500000000',
    'Hi! I need help with loyalty program registration.',
    'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء.'
) ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_global_registration_settings_updated_at
    BEFORE UPDATE ON global_registration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
