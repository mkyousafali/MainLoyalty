-- URBAN MARKET LOYALTY SYSTEM - PRODUCTION SCHEMA
-- Essential database tables for deployment

-- ===== BRANCHES TABLE =====
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- ===== CUSTOMERS TABLE =====
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mobile_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  branch_id UUID REFERENCES branches(id),
  total_points DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- ===== OFFERS TABLE =====
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  branch_id UUID REFERENCES branches(id),
  discount_percentage DECIMAL(5,2),
  valid_until TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  pdf_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- ===== TRANSACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transaction_amount DECIMAL(10,2) NOT NULL,
  points_earned DECIMAL(10,2) DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  branch_id UUID REFERENCES branches(id),
  description TEXT,
  transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'redemption', 'adjustment'))
);

-- ===== ADMIN USERS TABLE =====
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now())
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_offers_branch ON offers(branch_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON offers(valid_until);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_branch ON transactions(branch_id);

-- ===== ROW LEVEL SECURITY POLICIES =====
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for offers and branches
CREATE POLICY "Public can view active offers" ON offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active branches" ON branches
  FOR SELECT USING (is_active = true);

-- Customer policies (authenticated users can view their own data)
CREATE POLICY "Customers can view own profile" ON customers
  FOR SELECT USING (auth.uid()::text = mobile_number OR auth.role() = 'authenticated');

CREATE POLICY "Customers can view own transactions" ON transactions
  FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE mobile_number = auth.uid()::text
  ));

-- Admin policies (admin users can manage all data)
CREATE POLICY "Admins can manage offers" ON offers
  FOR ALL USING (auth.role() = 'service_role' OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email() AND is_active = true));

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (auth.role() = 'service_role' OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email() AND is_active = true));

CREATE POLICY "Admins can manage transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role' OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email() AND is_active = true));

-- ===== STORAGE BUCKETS (for file uploads) =====
-- Run these in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('offer-images', 'offer-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('offer-pdfs', 'offer-pdfs', true);

-- Storage policies
-- CREATE POLICY "Public can view offer images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'offer-images');

-- CREATE POLICY "Admin can upload offer images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'offer-images' AND auth.role() = 'authenticated');

SELECT 'Production schema setup complete!' as status;
