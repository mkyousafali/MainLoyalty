-- ========================================
-- APP ICONS STORAGE BUCKET SETUP
-- ========================================
-- Create storage bucket for app icons (PNG files only)

-- Create storage bucket for app icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-icons',
  'app-icons', 
  true,  -- Public bucket so icons can be accessed directly
  2097152,  -- 2MB file size limit
  ARRAY['image/png']  -- Only allow PNG files
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload app icons" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-icons');

-- Create storage policy to allow public read access to app icons
CREATE POLICY "Allow public read access to app icons" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'app-icons');

-- Create storage policy to allow authenticated users to delete their uploaded icons
CREATE POLICY "Allow authenticated users to delete app icons" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-icons');

SELECT 'App icons storage bucket created successfully!' as status;
