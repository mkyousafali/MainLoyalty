import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      throw error(400, 'Job ID is required');
    }

    // Mock cancel functionality
    console.log(`Mock: Cancelled job ${jobId}`);
    
    return json({ success: true, message: 'Job cancelled successfully' });

  } catch (err) {
    console.error('Job cancellation error:', err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Failed to cancel job');
  }
};
