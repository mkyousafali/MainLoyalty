<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  let settings = {
    id: null,
    whatsapp_link: 'https://wa.me/966500000000',
    message_template_en: 'Hi! I need help with loyalty program registration. Mobile number: {mobile}',
    message_template_ar: 'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: {mobile}',
    is_active: true
  };
  
  let isLoading = false;
  let isSaving = false;
  let message = '';
  let messageType = 'info'; // 'success', 'error', 'info'
  
  onMount(() => {
    loadSettings();
  });
  
  async function loadSettings() {
    try {
      isLoading = true;
      const { data, error } = await supabase
        .from('whatsapp_registration_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error loading WhatsApp settings:', error);
        if (error.code !== 'PGRST116') { // Not found error is OK for first time
          showMessage('Error loading settings: ' + error.message, 'error');
        }
      } else if (data) {
        settings = { ...data };
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      showMessage('Unexpected error loading settings', 'error');
    } finally {
      isLoading = false;
    }
  }
  
  async function saveSettings() {
    try {
      isSaving = true;
      
      // Validate WhatsApp link format
      if (!settings.whatsapp_link.startsWith('https://wa.me/')) {
        showMessage('WhatsApp link must start with https://wa.me/', 'error');
        return;
      }
      
      // Validate message templates contain {mobile} placeholder
      if (!settings.message_template_en.includes('{mobile}') || 
          !settings.message_template_ar.includes('{mobile}')) {
        showMessage('Message templates must contain {mobile} placeholder', 'error');
        return;
      }
      
      let result;
      if (settings.id) {
        // Update existing
        result = await supabase
          .from('whatsapp_registration_settings')
          .update({
            whatsapp_link: settings.whatsapp_link,
            message_template_en: settings.message_template_en,
            message_template_ar: settings.message_template_ar,
            is_active: settings.is_active,
            updated_by: 'admin'
          })
          .eq('id', settings.id);
      } else {
        // Insert new
        result = await supabase
          .from('whatsapp_registration_settings')
          .insert({
            whatsapp_link: settings.whatsapp_link,
            message_template_en: settings.message_template_en,
            message_template_ar: settings.message_template_ar,
            is_active: settings.is_active,
            updated_by: 'admin'
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      showMessage('WhatsApp registration settings saved successfully!', 'success');
      loadSettings(); // Reload to get updated data
      
    } catch (err) {
      console.error('Save error:', err);
      showMessage('Error saving settings: ' + err.message, 'error');
    } finally {
      isSaving = false;
    }
  }
  
  function showMessage(text, type = 'info') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }
  
  function resetToDefaults() {
    if (confirm('Are you sure you want to reset to default settings? This will overwrite your current changes.')) {
      settings = {
        id: settings.id,
        whatsapp_link: 'https://wa.me/966500000000',
        message_template_en: 'Hi! I need help with loyalty program registration. Mobile number: {mobile}',
        message_template_ar: 'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: {mobile}',
        is_active: true
      };
    }
  }
</script>

<svelte:head>
  <title>WhatsApp Registration Settings - Admin Panel</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
  <!-- Header -->
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">WhatsApp Registration Settings</h1>
        <p class="text-gray-600">Manage the WhatsApp link and message templates for login page registration requests</p>
      </div>
      <div class="flex items-center gap-2">
        <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
      </div>
    </div>
  </div>
  
  <!-- Status Message -->
  {#if message}
    <div class="mb-6 p-4 rounded-lg border-l-4 {messageType === 'success' ? 'bg-green-50 border-green-400 text-green-700' : messageType === 'error' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-blue-50 border-blue-400 text-blue-700'}">
      <div class="flex">
        <div class="flex-shrink-0">
          {#if messageType === 'success'}
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else if messageType === 'error'}
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <div class="ml-3">
          <p class="text-sm">{message}</p>
        </div>
      </div>
    </div>
  {/if}
  
  {#if isLoading}
    <!-- Loading State -->
    <div class="bg-white rounded-lg shadow-md p-6 text-center">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  {:else}
    <!-- Settings Form -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <form on:submit|preventDefault={saveSettings} class="space-y-6">
        
        <!-- WhatsApp Link -->
        <div>
          <label for="whatsapp_link" class="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Link
          </label>
          <div class="relative">
            <input
              type="url"
              id="whatsapp_link"
              bind:value={settings.whatsapp_link}
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://wa.me/966500000000"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500">Format: https://wa.me/[country_code][phone_number]</p>
        </div>
        
        <!-- Message Templates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- English Message Template -->
          <div>
            <label for="message_en" class="block text-sm font-medium text-gray-700 mb-2">
              English Message Template
            </label>
            <textarea
              id="message_en"
              bind:value={settings.message_template_en}
              required
              rows="4"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hi! I need help with loyalty program registration. Mobile number: [mobile]"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">Use {'{mobile}'} placeholder for the user's mobile number</p>
          </div>
          
          <!-- Arabic Message Template -->
          <div>
            <label for="message_ar" class="block text-sm font-medium text-gray-700 mb-2">
              Arabic Message Template / قالب الرسالة العربية
            </label>
            <textarea
              id="message_ar"
              bind:value={settings.message_template_ar}
              required
              rows="4"
              dir="rtl"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: [mobile]"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">استخدم {'{mobile}'} كرمز لرقم جوال المستخدم</p>
          </div>
        </div>
        
        <!-- Active Status -->
        <div class="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            bind:checked={settings.is_active}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="is_active" class="ml-2 block text-sm text-gray-700">
            Enable WhatsApp registration support
          </label>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            on:click={resetToDefaults}
            class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>
          
          <div class="flex gap-3">
            <button
              type="button"
              on:click={loadSettings}
              class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? 'Reloading...' : 'Reload'}
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              class="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
        
      </form>
    </div>
  {/if}
</div>
