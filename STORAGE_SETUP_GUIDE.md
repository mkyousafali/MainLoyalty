# 📦 How to Create Storage Bucket for Social Icons

## Quick Setup Guide

Follow these steps to create the storage bucket needed for custom social media icons:

### 1. Access Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **Storage** section in the left sidebar

### 2. Create New Bucket
- Click **"New Bucket"** button
- Enter bucket name: `social-icons`
- **Important**: Check "Public bucket" checkbox ✅

### 3. Configure Bucket Settings
- **File size limit**: `5242880` (5MB)
- **Allowed MIME types**: 
  ```
  image/png,image/jpeg,image/jpg,image/gif,image/webp
  ```

### 4. Verify Setup
- The bucket should appear in your storage list
- Try uploading a test image to verify it works
- The admin interface will show a green checkmark when ready

## Alternative: Use SQL Script

If you prefer using SQL, run this in your Supabase SQL Editor:

```sql
-- Run the setup_storage_bucket.sql file included in the project
```

## Troubleshooting

### Bucket Not Found Error
- Double-check the bucket name is exactly: `social-icons`
- Ensure the bucket is set to **public**
- Verify MIME types include image formats

### Permission Errors
- Ensure your user has storage permissions
- Check if RLS policies are properly configured
- Try refreshing the admin page after creating the bucket

### Upload Errors
- Check file format (PNG, JPG, GIF, WebP only)
- Verify file size is under 5MB
- Ensure stable internet connection

## ✅ Success Indicators

You'll know it's working when:
- ✅ Green status message appears in admin interface
- ✅ Custom icon uploads complete successfully  
- ✅ Uploaded icons display properly on guest login page

---

**Need Help?** 
Check the browser console for detailed error messages if uploads fail.
