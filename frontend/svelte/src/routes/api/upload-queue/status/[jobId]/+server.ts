import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      throw error(400, 'Job ID is required');
    }

    // Mock job data for testing
    const mockJob = {
      id: jobId,
      fileName: 'test-upload.xlsx',
      status: Math.random() > 0.5 ? 'processing' : 'completed',
      progress: {
        processed: Math.floor(Math.random() * 100),
        total: 100,
        failed: Math.floor(Math.random() * 3),
        skipped: 0
      },
      created_at: new Date().toISOString(),
      branchId: 'test-branch-1'
    };

    return json(mockJob);

  } catch (err) {
    console.error('Job status fetch error:', err);
    if (err instanceof Error && err.message.includes('404')) {
      throw error(404, 'Job not found');
    }
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Failed to fetch job status');
  }
};
