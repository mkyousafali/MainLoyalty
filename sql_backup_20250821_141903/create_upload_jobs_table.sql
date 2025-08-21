-- Create upload_jobs table for tracking file upload progress
-- This table stores information about Excel file uploads and their processing status

CREATE TABLE IF NOT EXISTS upload_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT 'system_user',
    branch_id TEXT,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused', 'cancelled')),
    total_transactions INTEGER DEFAULT 0,
    processed_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    error_msg TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_upload_jobs_user_id ON upload_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created_at ON upload_jobs(created_at DESC);

-- Add some sample data for testing (optional)
INSERT INTO upload_jobs (id, file_name, status, total_transactions, processed_transactions)
VALUES 
    ('test-job-1', 'sample_transactions.xlsx', 'completed', 50, 50),
    ('test-job-2', 'monthly_data.xlsx', 'processing', 100, 75)
ON CONFLICT (id) DO NOTHING;

-- Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'upload_jobs'
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ UPLOAD_JOBS TABLE CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 This table will track Excel upload progress';
    RAISE NOTICE '🔄 Status tracking: pending → processing → completed/failed';
    RAISE NOTICE '📁 File uploads will now be persistent and resumable';
END $$;
