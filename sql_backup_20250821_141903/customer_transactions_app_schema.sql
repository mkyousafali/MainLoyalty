-- ======================================
-- CUSTOMER TRANSACTIONS TABLE - APP COMPATIBLE SCHEMA
-- ======================================
-- This schema exactly matches what the upload manager is expecting

DROP TABLE IF EXISTS customer_transactions CASCADE;

CREATE TABLE customer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Bill/Transaction Basic Info
    bill_no TEXT,
    bill_date DATE,
    bill_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Customer References
    customer_id UUID REFERENCES customers(id),
    customer_mobile TEXT,
    
    -- Branch Reference
    branch_id UUID REFERENCES branches(id),
    
    -- Transaction Details
    transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'adjustment', 'bonus', 'redemption', 'upload')),
    amount DECIMAL(15,2) DEFAULT 0,
    
    -- Points (ALL INTEGER as database expects)
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    add_amt INTEGER DEFAULT 0,
    redeem INTEGER DEFAULT 0,
    
    -- Additional Fields
    notes TEXT,
    
    -- Timestamps
    transaction_date TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Optional fields that may be used elsewhere (keeping them for compatibility)
    transaction_id TEXT,
    customer_code TEXT,
    card_number TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital', 'points')),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    balance_after INTEGER DEFAULT 0,
    receipt_number TEXT,
    receipt_url TEXT,
    cashier_id TEXT,
    processed_by UUID REFERENCES admin_users(id),
    uploaded_by UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP DEFAULT NOW(),
    upload_batch_id UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_id ON customer_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_mobile ON customer_transactions(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_branch_id ON customer_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_no ON customer_transactions(bill_no);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_transaction_date ON customer_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_date ON customer_transactions(bill_date);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_status ON customer_transactions(status);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trigger_customer_transactions_updated_at ON customer_transactions;
CREATE TRIGGER trigger_customer_transactions_updated_at 
    BEFORE UPDATE ON customer_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policy
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON customer_transactions;
CREATE POLICY "Enable all operations for authenticated users" ON customer_transactions FOR ALL USING (true);

-- Comments for clarity
COMMENT ON TABLE customer_transactions IS 'Customer transaction records optimized for the upload manager app';
COMMENT ON COLUMN customer_transactions.points_earned IS 'Integer points earned (converted from decimal in app)';
COMMENT ON COLUMN customer_transactions.points_redeemed IS 'Integer points redeemed';
COMMENT ON COLUMN customer_transactions.add_amt IS 'Integer amount to add (same as points_earned)';
COMMENT ON COLUMN customer_transactions.redeem IS 'Integer amount to redeem (same as points_redeemed)';
COMMENT ON COLUMN customer_transactions.transaction_type IS 'Includes upload type for Excel imports';
