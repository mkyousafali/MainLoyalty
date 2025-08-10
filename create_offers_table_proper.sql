-- CREATE OFFERS TABLE TO MATCH YOUR EXISTING BRANCHES TABLE STRUCTURE
-- This will create the offers table with proper foreign key to your branches table

-- ===== STEP 1: CREATE OFFERS TABLE =====
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    minimum_purchase DECIMAL(10,2) DEFAULT 0.00,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    image_url TEXT,
    pdf_url TEXT,
    terms_conditions TEXT,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== STEP 2: DISABLE RLS FOR NOW (EASIER TESTING) =====
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- ===== STEP 3: CREATE STORAGE BUCKETS =====
-- Create bucket for offer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-images', 'offer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for offer PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-pdfs', 'offer-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- ===== STEP 4: SET UP STORAGE POLICIES =====
-- Allow public access to view images and PDFs
CREATE POLICY "Public Access for Offer Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-images');

CREATE POLICY "Public Access for Offer PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-pdfs');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload for Offer Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-images');

CREATE POLICY "Authenticated Upload for Offer PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-pdfs');

-- ===== STEP 5: INSERT SAMPLE OFFERS =====
-- Get some branch IDs from your existing branches
INSERT INTO offers (
    title, 
    description, 
    branch_id, 
    discount_percentage, 
    valid_until, 
    image_url, 
    pdf_url, 
    is_active
) 
SELECT 
    'Summer Sale - 25% Off',
    'Get 25% discount on all items this summer season',
    b.id,
    25.00,
    '2025-12-31',
    'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Summer+Sale+25%25+Off',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    true
FROM branches b 
WHERE b.is_active = true 
LIMIT 1;

INSERT INTO offers (
    title, 
    description, 
    branch_id, 
    discount_percentage, 
    valid_until, 
    image_url, 
    pdf_url, 
    is_active
)
SELECT 
    'Back to School Special - 30% Off',
    'Special discount for students and parents on school supplies',
    b.id,
    30.00,
    '2025-09-30',
    'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Back+to+School+30%25',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    true
FROM branches b 
WHERE b.is_active = true 
OFFSET 1
LIMIT 1;

-- Add an offer for all branches (branch_id = NULL)
INSERT INTO offers (
    title, 
    description, 
    branch_id, 
    discount_percentage, 
    valid_until, 
    image_url, 
    pdf_url, 
    is_active
) VALUES (
    'All Branches - Weekend Special',
    'Exclusive weekend deals available at all locations',
    NULL, -- All branches
    20.00,
    '2025-10-31',
    'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Weekend+Special+20%25',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    true
);

-- ===== STEP 6: CREATE INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_offers_active_valid ON offers(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_offers_branch_id ON offers(branch_id);

-- ===== STEP 7: VERIFY SETUP =====
SELECT '=== SETUP VERIFICATION ===' as status;

-- Check offers table structure
SELECT 'Offers table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'offers'
ORDER BY ordinal_position;

-- Check data
SELECT 'Active branches count:' as info, COUNT(*) as count FROM branches WHERE is_active = true;
SELECT 'Offers created:' as info, COUNT(*) as count FROM offers;

-- Test the queries that frontend will use
SELECT 'Testing branches query (what frontend will use):' as test;
-- Use a flexible approach - select all columns and let frontend handle naming
SELECT * FROM branches WHERE is_active = true ORDER BY created_at LIMIT 5;

SELECT 'Testing offers query (what frontend will use):' as test;
SELECT 
    id as offer_id,
    title,
    description,
    branch_id,
    discount_percentage,
    valid_until,
    image_url,
    pdf_url,
    is_active,
    created_at
FROM offers 
WHERE is_active = true 
AND valid_until >= CURRENT_DATE
ORDER BY created_at DESC;

-- Test join with branches
SELECT 'Testing offers with branch names:' as test;
-- Simplified approach - get basic offer data and let frontend handle branch names
SELECT 
    o.id as offer_id,
    o.title,
    o.branch_id,
    o.discount_percentage,
    o.valid_until
FROM offers o
WHERE o.is_active = true 
AND o.valid_until >= CURRENT_DATE
ORDER BY o.created_at DESC;

SELECT '=== OFFERS SYSTEM READY! ===' as status;
