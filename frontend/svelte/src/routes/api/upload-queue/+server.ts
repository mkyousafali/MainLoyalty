import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

// Mock storage for development
let mockJobs: any[] = [];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const branchId = formData.get('branchId') as string;

    if (!file || !branchId) {
      throw error(400, 'File and branch ID are required');
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Generate a mock job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create mock job
    const mockJob = {
      id: jobId,
      fileName: file.name,
      status: 'queued',
      progress: {
        processed: 0,
        total: data.length,
        failed: 0,
        skipped: 0
      },
      created_at: new Date().toISOString(),
      branchId: branchId
    };

    // Store in mock storage
    mockJobs.push(mockJob);

    // Simulate processing in background
    setTimeout(() => {
      const jobIndex = mockJobs.findIndex(j => j.id === jobId);
      if (jobIndex >= 0) {
        mockJobs[jobIndex].status = 'processing';
        
        // Simulate progress updates
        let processed = 0;
        const interval = setInterval(() => {
          processed += Math.floor(Math.random() * 5) + 1;
          if (processed >= data.length) {
            processed = data.length;
            mockJobs[jobIndex].status = 'completed';
            clearInterval(interval);
          }
          
          mockJobs[jobIndex].progress.processed = processed;
          
          // Add some random failures for testing
          if (Math.random() < 0.1 && mockJobs[jobIndex].progress.failed < 3) {
            mockJobs[jobIndex].progress.failed += 1;
          }
        }, 1000);
      }
    }, 2000);

    return json({
      success: true,
      jobId: jobId,
      message: `Upload queued successfully. Processing ${data.length} records.`,
    });

  } catch (err) {
    console.error('Upload error:', err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Upload failed');
  }
};
