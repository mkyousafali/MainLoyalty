-- OFFER ADVERTISEMENTS SYSTEM SCHEMA
-- Run this in Supabase SQL Editor

-- Create offer_advertisements table
CREATE TABLE IF NOT EXISTS offer_advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  offer_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  thumbnail_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table for storage links
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default storage link settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('offer_thumbnail_storage_link', '', 'url', 'Google Drive folder link for offer thumbnails'),
  ('offer_pdf_storage_link', '', 'url', 'Google Drive folder link for offer PDFs')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offer_advertisements_branch_id ON offer_advertisements(branch_id);
CREATE INDEX IF NOT EXISTS idx_offer_advertisements_status ON offer_advertisements(status);
CREATE INDEX IF NOT EXISTS idx_offer_advertisements_dates ON offer_advertisements(start_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_offer_advertisements_updated_at ON offer_advertisements;
CREATE TRIGGER update_offer_advertisements_updated_at
  BEFORE UPDATE ON offer_advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE offer_advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for offer_advertisements
-- Allow public read access for active offers
CREATE POLICY "Public can view active offers" ON offer_advertisements
  FOR SELECT USING (status = 'active');

-- Allow authenticated users (admins) full access
CREATE POLICY "Authenticated users can manage offers" ON offer_advertisements
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for admin_settings
-- Only authenticated users can access admin settings
CREATE POLICY "Only authenticated users can access admin settings" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to automatically expire old offers
CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void AS $$
BEGIN
  UPDATE offer_advertisements 
  SET status = 'expired'
  WHERE expiry_date < CURRENT_DATE 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function to run daily (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- You can also run this manually or via your application's cron job

-- Sample data for testing (optional)
-- INSERT INTO offer_advertisements (branch_id, offer_name, start_date, expiry_date, thumbnail_url, pdf_url)
-- VALUES 
--   (NULL, 'Store-wide Discount - 20% Off', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'https://example.com/thumbnail1.jpg', 'https://example.com/offer1.pdf'),
--   (NULL, 'Flash Sale - Electronics', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', 'https://example.com/thumbnail2.jpg', 'https://example.com/offer2.pdf');

-- Verify the tables were created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('offer_advertisements', 'admin_settings')
ORDER BY table_name, ordinal_position;
