-- COMPLETE OFFERS SYSTEM SETUP FOR SUPABASE
-- Run this in Supabase SQL Editor

-- Step 1: Create or update offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2), -- e.g., 20.50 for 20.5%
    discount_amount DECIMAL(10,2),    -- e.g., 25.00 for $25
    minimum_purchase_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER,              -- Max number of uses
    used_count INTEGER DEFAULT 0,     -- Current usage count
    branch_id UUID REFERENCES branches(id), -- NULL = All Branches
    
    -- NEW FIELDS for Visual System
    image_url TEXT,                   -- Public URL for PNG image
    pdf_url TEXT,                     -- Public URL for PDF file
    image_path TEXT,                  -- Storage path for image
    pdf_path TEXT,                    -- Storage path for PDF
    offer_type VARCHAR(50) DEFAULT 'general',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offers_branch_id ON offers(branch_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_dates ON offers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_offers_usage ON offers(usage_limit, used_count);

-- Step 3: Create storage buckets for offer files
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('offer-images', 'offer-images', true),
    ('offer-pdfs', 'offer-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Set up RLS policies for storage
-- Allow public read access to offer images
CREATE POLICY IF NOT EXISTS "Offer images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-images');

-- Allow public read access to offer PDFs
CREATE POLICY IF NOT EXISTS "Offer PDFs are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-pdfs');

-- Allow authenticated users to upload offer images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload offer images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload offer PDFs
CREATE POLICY IF NOT EXISTS "Authenticated users can upload offer PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-pdfs' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can delete offer images"
ON storage.objects FOR DELETE
USING (bucket_id = 'offer-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete offer PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'offer-pdfs' AND auth.role() = 'authenticated');

-- Step 5: Create RLS policies for offers table
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active offers
CREATE POLICY IF NOT EXISTS "Anyone can read active offers"
ON offers FOR SELECT
USING (is_active = true);

-- Allow authenticated users to manage offers
CREATE POLICY IF NOT EXISTS "Authenticated users can manage offers"
ON offers FOR ALL
USING (auth.role() = 'authenticated');

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS trigger_update_offers_updated_at ON offers;
CREATE TRIGGER trigger_update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

-- Step 8: Insert sample data (optional)
INSERT INTO offers (
    title, description, discount_percentage, start_date, end_date, 
    branch_id, is_active
) VALUES 
    ('Summer Sale - 20% Off', 'Get 20% off on all items this summer!', 20.00, '2025-08-01', '2025-08-31', NULL, true),
    ('New Customer Special', 'Special discount for new customers', 15.00, '2025-08-01', '2025-12-31', NULL, true)
ON CONFLICT DO NOTHING;

-- Step 9: Verify setup
SELECT 'Setup completed successfully! Check the following:' as status;

-- Check if table exists with correct columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'offers' 
ORDER BY ordinal_position;

-- Check storage buckets
SELECT name, public FROM storage.buckets WHERE name IN ('offer-images', 'offer-pdfs');

-- Check sample offers
SELECT id, title, branch_id, is_active, created_at FROM offers LIMIT 3;
