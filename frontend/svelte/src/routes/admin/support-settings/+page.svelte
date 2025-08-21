<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  // Global WhatsApp Support Settings
  let supportSettings = {
    whatsappNumber: 'https://wa.me/966500000000'
  };

  let globalMessage = '';
  let loading = false;

  // Load WhatsApp link from Supabase on component mount
  onMount(() => {
    loadGlobalSettings();
  });

  async function loadGlobalSettings() {
    try {
      loading = true;
      const { data, error } = await supabase
        .from('global_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_support_link')
        .single();

      if (error) {
        console.error('Error loading WhatsApp link:', error);
        // Fallback to localStorage if database fails
        const savedLink = localStorage.getItem('globalWhatsAppSupportLink');
        if (savedLink) {
          supportSettings.whatsappNumber = savedLink;
        }
        return;
      }

      if (data?.setting_value) {
        supportSettings.whatsappNumber = data.setting_value;
        console.log('WhatsApp link loaded from database:', data.setting_value);
      }
    } catch (error) {
      console.error('Error loading global settings:', error);
    } finally {
      loading = false;
    }
  }

  async function saveGlobalSettings() {
    // Validate WhatsApp link format
    if (!supportSettings.whatsappNumber.startsWith('https://wa.me/')) {
      globalMessage = '❌ WhatsApp link must start with https://wa.me/';
      return;
    }
    
    try {
      loading = true;
      globalMessage = '⏳ Saving to database...';
      
      console.log('🔄 Attempting to save WhatsApp link:', supportSettings.whatsappNumber);
      
      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: 'whatsapp_support_link',
          setting_value: supportSettings.whatsappNumber,
          description: 'Global WhatsApp support link for Urban Market',
          setting_type: 'text',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'setting_key',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Database error details:', error);
        globalMessage = `❌ Database error: ${error.message}`;
        
        // Also check if the table exists
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          globalMessage = '❌ Database table not found. Please create the global_settings table first.';
        }
        return;
      }

      console.log('✅ Database update successful:', data);
      
      // Also save to localStorage as backup
      localStorage.setItem('globalWhatsAppSupportLink', supportSettings.whatsappNumber);
      
      globalMessage = '✅ Global WhatsApp support link saved successfully!';
      console.log('✅ WhatsApp link saved successfully:', supportSettings.whatsappNumber);
      
    } catch (error) {
      globalMessage = `❌ Failed to save WhatsApp link: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Error saving global settings:', error);
    } finally {
      loading = false;
    }
  }
</script>

<!-- ✅ GLOBAL WHATSAPP SUPPORT CONFIGURATION -->
<div class="p-6 bg-green-50 border border-green-200 rounded-xl shadow mb-6 max-w-4xl mx-auto">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
      </svg>
    </div>
    <div>
      <h2 class="text-xl font-bold text-green-800">🌍 Global WhatsApp Support</h2>
      <p class="text-sm text-gray-700">Add WhatsApp link for customer support across the app</p>
    </div>
  </div>

  <!-- WhatsApp Link Input -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-800 mb-2">WhatsApp Link</label>
    <input
      type="url"
      bind:value={supportSettings.whatsappNumber}
      placeholder="https://wa.me/966500000000"
      class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg text-gray-900 bg-white placeholder-gray-500"
      style="color: #111827 !important;"
    />
    <p class="text-xs text-gray-600 mt-1">Enter the complete WhatsApp link (e.g., https://wa.me/966500000000)</p>
  </div>

  <!-- Save Button -->
  <button
    on:click={saveGlobalSettings}
    disabled={loading}
    class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {#if loading}
      ⏳ Saving...
    {:else}
      💾 Save WhatsApp Link
    {/if}
  </button>
  
  {#if globalMessage}
    <p class="mt-3 text-sm font-medium {globalMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}" style="color: {globalMessage.includes('✅') ? '#059669 !important' : '#dc2626 !important'};">
      {globalMessage}
    </p>
  {/if}
</div>

<!-- ✅ OTHER APPS MANAGEMENT -->
<div class="p-6 bg-violet-50 border border-violet-200 rounded-xl shadow mb-6 max-w-4xl mx-auto">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <div>
      <h2 class="text-xl font-bold text-violet-800">🌐 Other Apps Integration</h2>
      <p class="text-sm text-gray-700">Manage external applications and quick access links</p>
    </div>
  </div>

  <div class="space-y-4">
    <p class="text-gray-700">
      Configure and manage external applications that your team uses. Add apps with simple name and URL, 
      and they will appear in the admin sidebar for quick access with embedded viewing.
    </p>
    
    <div class="flex flex-wrap gap-3">
      <a 
        href="/admin/manage-other-apps"
        class="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors font-medium"
      >
        <span class="text-lg">🔧</span>
        Manage Other Apps
      </a>
    </div>

    <div class="bg-violet-100 p-4 rounded-lg">
      <h4 class="font-semibold text-violet-800 mb-2">Other Apps Features:</h4>
      <ul class="text-sm text-violet-700 space-y-1">
        <li>✅ Simple app management with name and URL</li>
        <li>✅ Direct browser tab opening for external apps</li>
        <li>✅ Session tracking and analytics</li>
        <li>✅ Quick access from admin sidebar</li>
        <li>✅ Category-based organization</li>
        <li>✅ Mobile-responsive design</li>
      </ul>
    </div>
  </div>
</div>

<style>
  /* Ensure all input fields, selects, and text are visible */
  input, select, textarea {
    color: #111827 !important;
    background-color: white !important;
  }
  
  input::placeholder {
    color: #6b7280 !important;
  }
  
  select option {
    color: #111827 !important;
    background-color: white !important;
  }
  
  /* Fix for form controls in any container */
  :global(.admin-form input),
  :global(.admin-form select),
  :global(.admin-form textarea) {
    color: #111827 !important;
    background-color: white !important;
  }
  
  /* Ensure labels are dark and visible */
  label {
    color: #374151 !important;
  }
  
  /* Make sure all text content is readable */
  p, span, div {
    color: inherit;
  }
  
  /* Ensure success and error messages are visible */
  .text-green-600 {
    color: #059669 !important;
    font-weight: 600 !important;
  }
  
  .text-red-600 {
    color: #dc2626 !important;
    font-weight: 600 !important;
  }
  
  /* Fix admin notes text visibility */
  .text-blue-800, .text-blue-900 {
    color: #1e40af !important;
  }
  
  /* Fix code blocks in admin notes */
  code {
    background-color: #dbeafe !important;
    color: #1e40af !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
    font-family: monospace !important;
  }
  
  /* Fix dropdown arrow visibility */
  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
  
  /* Ensure all text in cards and sections is visible */
  .bg-white, .bg-green-50, .bg-purple-50, .bg-blue-50 {
    color: #111827 !important;
  }
  
  /* Fix text in any colored backgrounds */
  .bg-gray-50 {
    color: #111827 !important;
  }
  
  /* Ensure buttons maintain proper contrast */
  button {
    color: inherit;
  }
  
  /* Fix any remaining text visibility issues */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
