<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let privacyPolicy = null;
  let isEditing = false;
  let isLoading = false;
  let message = '';
  let messageType = '';
  let activeTab = 'english'; // 'english' or 'arabic'

  // Form data
  let formData = {
    title_en: '',
    title_ar: '',
    content_en: '',
    content_ar: ''
  };

  onMount(async () => {
    // Test basic table access first
    console.log('Testing privacy_policy table access...');
    try {
      const testQuery = await supabase
        .from('privacy_policy')
        .select('id, title_en, is_active')
        .limit(5);
      
      console.log('Test query result:', testQuery);
    } catch (error) {
      console.error('Test query error:', error);
    }
    
    await loadPrivacyPolicy();
  });

  async function loadPrivacyPolicy() {
    isLoading = true;
    try {
      console.log('Loading privacy policy...');
      
      const { data, error } = await supabase
        .from('privacy_policy')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      console.log('Privacy policy query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Privacy policy query error:', error);
        throw error;
      }

      if (data) {
        console.log('Privacy policy data found:', data);
        privacyPolicy = data;
        formData = {
          title_en: data.title_en,
          title_ar: data.title_ar,
          content_en: data.content_en,
          content_ar: data.content_ar
        };
      } else {
        console.log('No privacy policy data found');
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
      showMessage('Error loading privacy policy: ' + error.message, 'error');
    } finally {
      isLoading = false;
    }
  }

  async function savePrivacyPolicy() {
    if (!formData.title_en.trim() || !formData.content_en.trim()) {
      showMessage('Please fill in at least the English title and content', 'error');
      return;
    }

    isLoading = true;
    try {
      // If there's an existing policy, deactivate it
      if (privacyPolicy) {
        await supabase
          .from('privacy_policy')
          .update({ is_active: false })
          .eq('id', privacyPolicy.id);
      }

      // Create new version
      const newVersion = privacyPolicy ? privacyPolicy.version + 1 : 1;
      
      const { data, error } = await supabase
        .from('privacy_policy')
        .insert([{
          ...formData,
          version: newVersion,
          updated_by: 'admin', // Simple admin identifier
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      privacyPolicy = data;
      isEditing = false;
      showMessage('Privacy Policy updated successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      showMessage('Error saving privacy policy: ' + error.message, 'error');
    } finally {
      isLoading = false;
    }
  }

  function startEditing() {
    isEditing = true;
    showMessage('', '');
  }

  function cancelEditing() {
    isEditing = false;
    if (privacyPolicy) {
      formData = {
        title_en: privacyPolicy.title_en,
        title_ar: privacyPolicy.title_ar,
        content_en: privacyPolicy.content_en,
        content_ar: privacyPolicy.content_ar
      };
    }
  }

  function showMessage(text, type) {
    message = text;
    messageType = type;
    if (text) {
      setTimeout(() => {
        message = '';
        messageType = '';
      }, 5000);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Privacy Policy Management - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b border-gray-200 mb-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-6">
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Privacy Policy Management</h1>
        <p class="text-gray-600">Manage privacy policy content for both English and Arabic languages</p>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Message Display -->
    {#if message}
      <div class="mb-6 p-4 rounded-lg {messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
        {message}
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Policy Info Header -->
      {#if privacyPolicy && !isEditing}
        <div class="p-6 border-b border-gray-200 bg-gray-50">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Current Privacy Policy</h2>
              <p class="text-sm text-gray-600">
                Version {privacyPolicy.version} • Last updated: {formatDate(privacyPolicy.last_updated)}
              </p>
            </div>
            <button 
              on:click={startEditing}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Policy
            </button>
          </div>
        </div>
      {/if}

      <!-- Edit Mode or Create New -->
      {#if isEditing || !privacyPolicy}
        <form on:submit|preventDefault={savePrivacyPolicy} class="p-6">
          <!-- Action Buttons -->
          <div class="mb-6 flex flex-wrap gap-3">
            <button 
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : privacyPolicy ? 'Save Changes' : 'Create Privacy Policy'}
            </button>
            
            {#if privacyPolicy}
              <button 
                type="button"
                on:click={cancelEditing}
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
            {/if}
          </div>

          <!-- Language Tabs -->
          <div class="mb-6">
            <div class="border-b border-gray-200">
              <nav class="flex space-x-8">
                <button
                  type="button"
                  on:click={() => activeTab = 'english'}
                  class="py-3 px-1 border-b-2 font-medium text-sm {activeTab === 'english' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                >
                  English
                </button>
                <button
                  type="button"
                  on:click={() => activeTab = 'arabic'}
                  class="py-3 px-1 border-b-2 font-medium text-sm {activeTab === 'arabic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                >
                  العربية (Arabic)
                </button>
              </nav>
            </div>
          </div>

          <!-- English Tab -->
          {#if activeTab === 'english'}
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">English Title *</label>
                <input
                  type="text"
                  bind:value={formData.title_en}
                  placeholder="Privacy Policy"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">English Content *</label>
                <textarea
                  bind:value={formData.content_en}
                  placeholder="Enter privacy policy content in English..."
                  required
                  rows="25"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                ></textarea>
              </div>
            </div>
          {/if}

          <!-- Arabic Tab -->
          {#if activeTab === 'arabic'}
            <div class="space-y-6" dir="rtl">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">العنوان بالعربية</label>
                <input
                  type="text"
                  bind:value={formData.title_ar}
                  placeholder="سياسة الخصوصية"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">المحتوى بالعربية</label>
                <textarea
                  bind:value={formData.content_ar}
                  placeholder="أدخل محتوى سياسة الخصوصية بالعربية..."
                  rows="25"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-right"
                ></textarea>
              </div>
            </div>
          {/if}

          <!-- Bottom Action Buttons -->
          <div class="mt-8 flex flex-wrap gap-3">
            <button 
              type="submit"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : privacyPolicy ? 'Save Changes' : 'Create Privacy Policy'}
            </button>
            
            {#if privacyPolicy}
              <button 
                type="button"
                on:click={cancelEditing}
                class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
            {/if}
          </div>
        </form>
      {:else}
        <!-- View Mode -->
        <div class="p-6">
          <!-- Language Tabs for View Mode -->
          <div class="mb-6">
            <div class="border-b border-gray-200">
              <nav class="flex space-x-8">
                <button
                  type="button"
                  on:click={() => activeTab = 'english'}
                  class="py-3 px-1 border-b-2 font-medium text-sm {activeTab === 'english' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                >
                  English
                </button>
                <button
                  type="button"
                  on:click={() => activeTab = 'arabic'}
                  class="py-3 px-1 border-b-2 font-medium text-sm {activeTab === 'arabic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                >
                  العربية (Arabic)
                </button>
              </nav>
            </div>
          </div>

          <!-- English Content -->
          {#if activeTab === 'english'}
            <div class="space-y-4">
              <h2 class="text-2xl font-bold text-gray-900">{privacyPolicy.title_en}</h2>
              <div class="prose max-w-none text-gray-700 whitespace-pre-line">
                {privacyPolicy.content_en}
              </div>
            </div>
          {/if}

          <!-- Arabic Content -->
          {#if activeTab === 'arabic'}
            <div class="space-y-4" dir="rtl">
              <h2 class="text-2xl font-bold text-gray-900">{privacyPolicy.title_ar}</h2>
              <div class="prose max-w-none text-gray-700 whitespace-pre-line text-right">
                {privacyPolicy.content_ar}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  </div>
</div>

<style>
  /* Custom styles for better text handling */
  .prose {
    line-height: 1.6;
  }
  
  textarea {
    font-family: inherit;
    line-height: 1.6;
  }
  
  /* RTL support */
  [dir="rtl"] {
    text-align: right;
  }
  
  [dir="rtl"] input, [dir="rtl"] textarea {
    text-align: right;
  }
</style>
