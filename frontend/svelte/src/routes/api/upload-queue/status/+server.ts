import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

const BACKEND_URL = 'http://localhost:8080'; // Adjust based on your Go server port

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const ids = url.searchParams.get('ids');
    
    if (!ids) {
      throw error(400, 'Job IDs are required');
    }

    // Split IDs and fetch status for each
    const jobIds = ids.split(',').filter(id => id.trim());
    const statusPromises = jobIds.map(async (jobId) => {
      const response = await fetch(`${BACKEND_URL}/api/uploads/status/${jobId.trim()}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    });

    const results = await Promise.all(statusPromises);
    const validResults = results.filter(result => result !== null);

    return json(validResults);

  } catch (err) {
    console.error('Status fetch error:', err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Failed to fetch upload status');
  }
};
