import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

const BACKEND_URL = 'http://localhost:8080'; // Adjust based on your Go server port

export const GET: RequestHandler = async ({ params, fetch }) => {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      throw error(400, 'Job ID is required');
    }

    const response = await fetch(`${BACKEND_URL}/api/uploads/status/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw error(404, 'Job not found');
      }
      throw error(response.status, 'Failed to fetch job status');
    }

    const result = await response.json();
    return json(result);

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
