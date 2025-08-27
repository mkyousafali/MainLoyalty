# 🗄️ Supabase Storage Setup Guide

## 📋 Overview
Using Supabase Storage is **much simpler** than Google Drive and integrates perfectly with your existing authentication system!

## 🚀 Setup Steps (5 minutes)

### 1. Create Storage Bucket in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: MainLoyalty
3. **Navigate to Storage** (left sidebar)
4. **Click "New Bucket"**
5. **Bucket Details**:
   - **Name**: `offer-files`
   - **Public**: ✅ Enabled (so URLs work directly)
   - **File size limit**: `10MB` (for thumbnails and PDFs)
   - **Allowed MIME types**: `image/*, application/pdf`
6. **Click "Create Bucket"**

### 2. Set Up Storage Policies (Security)

In the Supabase dashboard, go to **Storage > Policies** and create:

#### **Policy 1: Public Read Access**
```sql
-- Allow anyone to view offer files
CREATE POLICY "Public read access for offer files" ON storage.objects
FOR SELECT USING (bucket_id = 'offer-files');
```

#### **Policy 2: Authenticated Upload**
```sql
-- Allow authenticated users to upload offer files
CREATE POLICY "Authenticated users can upload offer files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);
```

#### **Policy 3: Admin Delete/Update**
```sql
-- Allow authenticated users to manage their uploaded files
CREATE POLICY "Authenticated users can manage offer files" ON storage.objects
FOR ALL USING (
  bucket_id = 'offer-files' AND 
  auth.role() = 'authenticated'
);
```

### 3. Test Upload (Ready to Go!)

Your system is now ready! When you upload files:

**Thumbnails** → Stored in: `offer-files/thumbnails/offer_1756317964290.jpg`
**PDFs** → Stored in: `offer-files/pdfs/offer_1756317964290.pdf`

**Generated URLs** will look like:
```
https://your-project.supabase.co/storage/v1/object/public/offer-files/thumbnails/offer_1756317964290.jpg
```

## ✅ Benefits of Supabase Storage vs Google Drive

| Feature | Supabase Storage | Google Drive API |
|---------|------------------|------------------|
| **Setup Complexity** | ⭐ Simple (5 min) | 🔧 Complex (30+ min) |
| **Authentication** | ✅ Built-in | ❌ OAuth2/Service Account |
| **Integration** | ✅ Native with your DB | ❌ External service |
| **File Management** | ✅ Admin panel built-in | ❌ Separate interface |
| **Cost** | ✅ Included in plan | ❌ Separate billing |
| **Performance** | ⚡ Same region as DB | 🌐 External API calls |
| **Security** | ✅ RLS policies | 🔐 Complex permissions |

## 🎯 What Happens Now

1. **User uploads thumbnail** → File saved to `offer-files/thumbnails/`
2. **User uploads PDF** → File saved to `offer-files/pdfs/`
3. **URLs generated** → Direct Supabase CDN links (fast!)
4. **Files viewable** → Public URLs work immediately
5. **Admin management** → Can view/delete files in Supabase dashboard

## 🔧 Advanced Configuration (Optional)

### Custom File Organization
You can organize files by branch or date:
```
offer-files/
  ├── thumbnails/
  │   ├── branch-1/offer_1756317964290.jpg
  │   └── branch-2/offer_1756317964291.jpg
  └── pdfs/
      ├── branch-1/offer_1756317964290.pdf
      └── branch-2/offer_1756317964291.pdf
```

### Automatic File Cleanup
Create a Supabase Edge Function to clean up old offer files automatically.

## 🎉 Ready to Upload!

Your offer upload system now uses Supabase Storage with:
- ✅ **Simple setup** (just create bucket)
- ✅ **Real progress tracking**
- ✅ **Integrated with your auth**
- ✅ **Fast CDN delivery**
- ✅ **Easy file management**

No more complex Google Drive API setup needed! 🚀
