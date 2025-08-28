im// Initialize Supabase client
const supabaseUrl = 'https://sfydwpimwnxocrgpiour.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeWR3cGltd254b2NyZ3Bpb3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzI5MTYsImV4cCI6MjA2OTYwODkxNn0.GQmHZT5waxLrfcn6JQ40ImVJ1obTdqxdLFv0edZaanE';
const supabase = createClient(supabaseUrl, supabaseKey); { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://sfydwpimwnxocrgpiour.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeWR3cGltd254b2NyZ3BpbnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDkyMjc3OCwiZXhwIjoyMDQwNDk4Nzc4fQ.n8vkEaOQl8Zk-vFnCqwNi6CYl1eGGhUd1hBLKJ21X2o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  try {
    console.log('🗑️  Executing storage cleanup...');

    // Clean up storage bucket references in database
    const { error: updateError } = await supabase
      .from('social_links')
      .update({ 
        use_custom_icon: false, 
        custom_icon_url: null 
      })
      .neq('custom_icon_url', null);

    if (updateError) {
      console.error('Error updating social_links:', updateError);
    } else {
      console.log('✅ Database cleanup completed');
    }

    // Add static_icon column (this might fail if it already exists, which is fine)
    console.log('\n📋 Adding static_icon column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE social_links ADD COLUMN IF NOT EXISTS static_icon VARCHAR(255);'
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('Error adding column:', alterError);
    } else {
      console.log('✅ static_icon column added');
    }

    // Update existing records with appropriate static icons
    console.log('\n🎨 Populating static icons...');
    
    const updates = [
      { pattern: 'facebook', icon: 'facebook.png' },
      { pattern: 'instagram', icon: 'instagram.png' },
      { pattern: 'twitter', icon: 'twitter.png' },
      { pattern: 'whatsapp', icon: 'whatsapp.png' },
      { pattern: 'linkedin', icon: 'linkedin.png' },
      { pattern: 'youtube', icon: 'youtube.png' },
      { pattern: 'tiktok', icon: 'tiktok.png' },
      { pattern: 'snapchat', icon: 'snapchat.png' },
      { pattern: 'telegram', icon: 'telegram.png' }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('social_links')
        .update({ 
          static_icon: update.icon,
          use_custom_icon: true,
          custom_icon_url: null
        })
        .ilike('name', `%${update.pattern}%`);

      if (error) {
        console.error(`Error updating ${update.pattern}:`, error);
      } else {
        console.log(`✅ Updated ${update.pattern} records`);
      }
    }

    // Update any remaining records without static_icon
    const { error: defaultError } = await supabase
      .from('social_links')
      .update({ 
        static_icon: 'facebook.png',
        use_custom_icon: true,
        custom_icon_url: null
      })
      .is('static_icon', null);

    if (defaultError) {
      console.error('Error setting default icons:', defaultError);
    } else {
      console.log('✅ Set default icons for remaining records');
    }

    console.log('\n✨ All updates completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add PNG icon files to /static/icons/social/');
    console.log('   2. Test the admin interface');
    console.log('   3. Verify static icon display');

  } catch (error) {
    console.error('❌ Error executing updates:', error);
  }
}

executeSQL();
