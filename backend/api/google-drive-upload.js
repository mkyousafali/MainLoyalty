// Google Drive Upload API Endpoint
// Save this as: backend/api/google-drive-upload.js (or .ts)

import { google } from 'googleapis';
import multer from 'multer';

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Google Drive API setup with Service Account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

export async function POST(request) {
  try {
    console.log('🚀 Starting Google Drive upload...');
    
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId');
    
    if (!file) {
      console.error('❌ No file provided');
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!folderId) {
      console.error('❌ No folder ID provided');
      return new Response(JSON.stringify({ error: 'No folder ID provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📁 Uploading "${file.name}" to folder: ${folderId}`);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `offer_${timestamp}.${extension}`;
    
    console.log(`📝 Generated filename: ${fileName}`);

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: file.type,
        body: buffer
      }
    });

    console.log(`✅ File uploaded with ID: ${response.data.id}`);

    // Make file publicly readable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log('🌐 File made publicly accessible');

    // Generate the appropriate URL based on file type
    const isImage = file.type.startsWith('image/');
    const fileUrl = isImage 
      ? `https://drive.google.com/uc?id=${response.data.id}&export=view`
      : `https://drive.google.com/file/d/${response.data.id}/view`;

    console.log(`🔗 Generated URL: ${fileUrl}`);

    return new Response(JSON.stringify({
      success: true,
      fileId: response.data.id,
      fileName: fileName,
      url: fileUrl,
      mimeType: file.type
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Google Drive upload error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export for different frameworks
export { POST as post }; // For SvelteKit
// module.exports = { POST }; // For Express/Node.js
