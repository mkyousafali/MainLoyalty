# 🚀 Google Drive Real Upload Integration Guide

## 📋 Overview
This guide shows you how to set up **real Google Drive file uploads** for your Offer Advertisement system instead of the current simulation.

## 🔑 Step 1: Get Google Drive API Credentials

### Option A: Service Account (Recommended for Server)
1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create new project or select existing
3. **Enable Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"
4. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in details and create
5. **Generate Key**:
   - Click on created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key" > "JSON"
   - Download the JSON file (keep it secure!)

### Option B: OAuth2 (For User Authentication)
1. **Create OAuth2 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add your domain to authorized origins

## 🛠️ Step 2: Backend Implementation

### Create API Endpoint (`/api/google-drive-upload`)

```typescript
// backend/api/google-drive-upload.ts
import { google } from 'googleapis';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// Service Account Method
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account-key.json', // Your downloaded JSON
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId');
    
    if (!file || !folderId) {
      return new Response('Missing file or folderId', { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: `offer_${Date.now()}.${file.name.split('.').pop()}`,
        parents: [folderId]
      },
      media: {
        mimeType: file.type,
        body: buffer
      }
    });

    // Make file publicly viewable (optional)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return new Response(JSON.stringify({
      fileId: response.data.id,
      url: `https://drive.google.com/uc?id=${response.data.id}&export=view`
    }));

  } catch (error) {
    console.error('Google Drive upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
}
```

## 🎯 Step 3: Update Frontend Upload Function

Replace the mock upload with real API call:

```typescript
// In your +page.svelte
async function uploadToGoogleDrive(file, folderId, onProgress) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(Math.round(progress));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/google-drive-upload');
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

## 🔐 Step 4: Share Your Google Drive Folders

### Make Folders Accessible:
1. **Open Google Drive**: Go to your folders
   - Thumbnail folder: `1XARIP5wQM4AegrAEP7oenz3ac7ZDGT2z`
   - PDF folder: `1B8Zz52x-bR31ZiW5bZowQAU06RVq4J-e`

2. **Share with Service Account**:
   - Right-click folder → "Share"
   - Add your service account email (from JSON file)
   - Give "Editor" permissions

3. **Or Make Public** (less secure):
   - Right-click folder → "Share"
   - Change to "Anyone with the link can view/edit"

## 🚀 Step 5: Deploy and Test

### Environment Variables:
```bash
# Add to your .env file
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
```

### Test Upload:
1. Start your server
2. Try uploading a file through the wizard
3. Check your Google Drive folders for the uploaded files
4. Verify the generated URLs work

## 🔧 Alternative: Direct Browser Upload

If you prefer client-side only (no backend):

```typescript
// Load Google APIs
const gapi = window.gapi;

async function initializeGoogleDrive() {
  await gapi.load('auth2', () => {
    gapi.auth2.init({
      client_id: 'YOUR_OAUTH_CLIENT_ID'
    });
  });
}

async function uploadWithGAPI(file, folderId) {
  const authInstance = gapi.auth2.getAuthInstance();
  await authInstance.signIn();
  
  const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
  
  // Use the access token for upload...
}
```

## ✅ Quick Setup Checklist

- [ ] Enable Google Drive API in Google Cloud Console
- [ ] Create Service Account and download JSON key
- [ ] Share Google Drive folders with service account
- [ ] Create backend API endpoint for upload
- [ ] Update frontend upload function
- [ ] Add environment variables
- [ ] Test file upload
- [ ] Verify files appear in Google Drive
- [ ] Test generated URLs work

## 🆘 Need Help?

1. **Authentication Issues**: Check service account permissions
2. **Upload Fails**: Verify folder sharing and API enabled  
3. **Files Not Visible**: Check folder permissions
4. **URLs Don't Work**: Ensure public sharing is enabled

Your real Google Drive integration will be working once you complete these steps! 🎯
