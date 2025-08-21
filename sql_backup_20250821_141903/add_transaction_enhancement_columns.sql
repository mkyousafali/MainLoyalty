-- Add bill_number and points_redeemed columns to customer_transactions table
-- These columns support the enhanced Excel format with bill tracking and point redemption

ALTER TABLE customer_transactions 
ADD COLUMN IF NOT EXISTS bill_number TEXT;

ALTER TABLE customer_transactions 
ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0;

-- Create index for bill number lookups
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_number ON customer_transactions(bill_number);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customer_transactions'
  AND column_name IN ('bill_number', 'points_redeemed')
ORDER BY column_name;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ ENHANCED TRANSACTION TRACKING COLUMNS ADDED!';
    RAISE NOTICE '📋 Added bill_number for tracking individual bills';
    RAISE NOTICE '🎁 Added points_redeemed for redemption tracking';
    RAISE NOTICE '🔍 Added index for efficient bill number lookups';
    RAISE NOTICE '📊 Excel uploads now support full bill and points tracking';
END $$;
