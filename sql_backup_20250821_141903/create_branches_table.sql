-- Updated branches table structure to match frontend forms
-- This includes the Snap link field and proper URL field naming

-- Drop existing table if you want to recreate (CAUTION: This will delete data)
-- DROP TABLE IF EXISTS branches CASCADE;

-- Create updated branches table with Snap support
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    location VARCHAR(255),
    location_ar VARCHAR(255),
    website_url VARCHAR(255),
    instagram_url VARCHAR(255),
    snap_url VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    transaction_table_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT branches_name_check CHECK (char_length(name) >= 2),
    CONSTRAINT branches_phone_check CHECK (contact_phone ~ '^[0-9+\-\s\(\)]+$')
);

-- Add Snap URL column to existing table (if table already exists)
ALTER TABLE branches ADD COLUMN IF NOT EXISTS snap_url VARCHAR(255);

-- Update column names to match frontend expectations (if needed)
-- These commands will only run if the old columns exist
DO $$
BEGIN
    -- Rename website to website_url if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'website') THEN
        ALTER TABLE branches RENAME COLUMN website TO website_url;
    END IF;
    
    -- Rename instagram to instagram_url if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'instagram') THEN
        ALTER TABLE branches RENAME COLUMN instagram TO instagram_url;
    END IF;
    
    -- Update name_en to name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'name_en') THEN
        ALTER TABLE branches RENAME COLUMN name_en TO name;
    END IF;
    
    -- Update location_en to location if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'location_en') THEN
        ALTER TABLE branches RENAME COLUMN location_en TO location;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_created_at ON branches(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for branch access
CREATE POLICY "Enable read access for all users" ON branches
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON branches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON branches
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON branches
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data with all social media links
INSERT INTO branches (name, name_ar, location, location_ar, website_url, instagram_url, snap_url, contact_phone, address) VALUES
('Main Branch - Riyadh', 'الفرع الرئيسي - الرياض', 'King Fahd Road, Riyadh', 'طريق الملك فهد، الرياض', 'https://urbanmarket.com/riyadh', 'https://instagram.com/urbanriyadh', 'https://snapchat.com/add/urbanriyadh', '+966123456789', 'King Fahd Road, Al Olaya District, Riyadh 12612, Saudi Arabia'),
('Branch 2 - Jeddah', 'الفرع الثاني - جدة', 'Tahlia Street, Jeddah', 'شارع التحلية، جدة', 'https://urbanmarket.com/jeddah', 'https://instagram.com/urbanjeddah', 'https://snapchat.com/add/urbanjeddah', '+966122445678', 'Tahlia Street, Al Andalus District, Jeddah 23326, Saudi Arabia'),
('Branch 3 - Dammam', 'الفرع الثالث - الدمام', 'King Saud Road, Dammam', 'طريق الملك سعود، الدمام', 'https://urbanmarket.com/dammam', 'https://instagram.com/urbandammam', 'https://snapchat.com/add/urbandammam', '+966133234567', 'King Saud Road, Al Ferdous District, Dammam 32414, Saudi Arabia')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verification query to check the table structure
-- SELECT column_name, data_type, character_maximum_length, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'branches' 
-- ORDER BY ordinal_position;
