import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return json({ error: 'Missing url parameter' }, { status: 400 });
  }
  
  // Validate that it's a Supabase storage URL for security
  if (!imageUrl.includes('supabase.co/storage')) {
    return json({ error: 'Invalid URL - only Supabase storage URLs allowed' }, { status: 400 });
  }
  
  try {
    console.log('🔄 Proxying image request:', imageUrl);
    
    // Fetch the image from Supabase
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch image from Supabase:', response.status, response.statusText);
      return json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status });
    }
    
    // Get the image as array buffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log('✅ Image fetched successfully, size:', imageBuffer.byteLength, 'bytes, type:', contentType);
    
    // Return the image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Error proxying image:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
