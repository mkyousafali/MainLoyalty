-- Create upload_jobs table for tracking Excel upload progress with pause/resume functionality
CREATE TABLE IF NOT EXISTS upload_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL DEFAULT 'system_user',
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, paused, completed, failed, cancelled
    total_transactions INTEGER NOT NULL DEFAULT 0,
    processed_transactions INTEGER NOT NULL DEFAULT 0,
    failed_transactions INTEGER NOT NULL DEFAULT 0,
    
    -- Progress tracking
    progress JSONB DEFAULT '{}',
    errors JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_msg TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_branch_id ON upload_jobs(branch_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created_at ON upload_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_user_id ON upload_jobs(user_id);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations on upload_jobs" ON upload_jobs;

-- Policy to allow all operations for now (adjust based on your auth system)
CREATE POLICY "Allow all operations on upload_jobs" 
ON upload_jobs FOR ALL 
USING (true);

-- Add comments for documentation
COMMENT ON TABLE upload_jobs IS 'Tracks Excel file upload progress with pause/resume functionality';
COMMENT ON COLUMN upload_jobs.status IS 'Upload status: pending, processing, paused, completed, failed, cancelled';
COMMENT ON COLUMN upload_jobs.progress IS 'JSON object containing detailed progress information';
COMMENT ON COLUMN upload_jobs.errors IS 'Array of error objects for failed transactions';
COMMENT ON COLUMN upload_jobs.metadata IS 'Additional metadata about the upload process';
