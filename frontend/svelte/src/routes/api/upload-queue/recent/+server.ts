import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Mock recent jobs data for testing
    const mockJobs = [];
    for (let i = 0; i < Math.min(limit, 5); i++) {
      mockJobs.push({
        id: `job-${Date.now()}-${i}`,
        fileName: `upload-${i + 1}.xlsx`,
        status: ['completed', 'processing', 'failed'][Math.floor(Math.random() * 3)],
        progress: {
          processed: Math.floor(Math.random() * 100),
          total: 100,
          failed: Math.floor(Math.random() * 5),
          skipped: 0
        },
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        branchId: `branch-${i + 1}`
      });
    }

    return json(mockJobs);

  } catch (err) {
    console.error('Recent uploads fetch error:', err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Failed to fetch recent uploads');
  }
};
