// SvelteKit API endpoint for Google Drive upload
// This is a temporary test endpoint that simulates upload for now

// Handle HEAD requests for API availability check
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    console.log('📡 API endpoint hit: /api/google-drive-upload');
    
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId');
    
    console.log('📁 File received:', file && typeof file === 'object' ? file.name : 'No file');
    console.log('📂 Folder ID:', folderId);
    
    if (!file || typeof file === 'string') {
      console.error('❌ No valid file provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!folderId) {
      console.error('❌ No folder ID provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No folder ID provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock response
    const timestamp = Date.now();
    const extension = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `offer_${timestamp}.${extension}`;
    
    // Create working URLs based on file type
    const isImage = file.type ? file.type.startsWith('image/') : true;
    const mockUrl = isImage 
      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzlGRjE0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+VXBsb2FkZWQgVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
      : 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

    console.log('✅ Mock upload successful:', fileName);
    console.log('🔗 Generated URL:', mockUrl);

    return new Response(JSON.stringify({
      success: true,
      fileId: `mock_${timestamp}`,
      fileName: fileName,
      url: mockUrl,
      mimeType: file.type || 'application/octet-stream',
      message: 'File uploaded successfully (mock)'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ API error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
