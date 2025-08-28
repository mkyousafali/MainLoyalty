// Script to create the social-icons storage bucket in Supabase
// Run this if you need to manually create the storage bucket

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://sfydwpimwnxocrgpiour.supabase.co';
const supabaseKey = 'your-anon-key-here'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSocialIconsBucket() {
  try {
    console.log('Creating social-icons storage bucket...');
    
    // First check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'social-icons');
    
    if (bucketExists) {
      console.log('✅ Storage bucket "social-icons" already exists');
      return;
    }
    
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket('social-icons', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB limit
    });
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError);
    } else {
      console.log('✅ Storage bucket "social-icons" created successfully!');
      
      // Test upload to verify bucket is working
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-icons')
        .upload('test-file.txt', testContent);
        
      if (uploadError) {
        console.error('❌ Test upload failed:', uploadError);
      } else {
        console.log('✅ Test upload successful');
        
        // Clean up test file
        await supabase.storage.from('social-icons').remove(['test-file.txt']);
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createSocialIconsBucket();
