<!-- Simplified Social Media Icons Management -->
<!-- Uses static icons from /static/icons/social/ folder -->

<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let branches = [];
  let socialLinks = [];
  let selectedBranchId = '';
  let showAddForm = false;
  let saving = false;

  // Static icon options - files should be placed in /static/icons/social/
  const availableIcons = [
    { name: 'Facebook', file: 'facebook.png', emoji: '📘' },
    { name: 'Instagram', file: 'instagram.png', emoji: '📷' },
    { name: 'Twitter', file: 'twitter.png', emoji: '🐦' },
    { name: 'WhatsApp', file: 'whatsapp.png', emoji: '💬' },
    { name: 'LinkedIn', file: 'linkedin.png', emoji: '💼' },
    { name: 'YouTube', file: 'youtube.png', emoji: '📺' },
    { name: 'TikTok', file: 'tiktok.png', emoji: '🎵' },
    { name: 'Snapchat', file: 'snapchat.png', emoji: '👻' },
    { name: 'Telegram', file: 'telegram.png', emoji: '✈️' }
  ];

  let formData = {
    id: null,
    branch_id: '',
    name: '',
    url: '',
    icon: '📘',
    static_icon: 'facebook.png', // Use static icon file
    is_active: true,
    use_custom_icon: false,
    sort_order: 0
  };

  onMount(async () => {
    await loadBranches();
    if (branches.length > 0) {
      selectedBranchId = branches[0].id;
      await loadSocialLinks();
    }
  });

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .eq('is_active', true);

      if (error) throw error;
      branches = data || [];
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  async function loadSocialLinks() {
    if (!selectedBranchId) return;

    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('branch_id', selectedBranchId)
        .order('sort_order');

      if (error) throw error;
      socialLinks = data || [];
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  }

  function resetForm() {
    formData = {
      id: null,
      branch_id: '',
      name: '',
      url: '',
      icon: '📘',
      static_icon: 'facebook.png',
      is_active: true,
      use_custom_icon: false,
      sort_order: 0
    };
  }

  function showAdd() {
    resetForm();
    showAddForm = true;
  }

  function cancelAdd() {
    resetForm();
    showAddForm = false;
  }

  // Handle icon selection
  function selectIcon(iconData) {
    formData.name = iconData.name;
    formData.icon = iconData.emoji;
    formData.static_icon = iconData.file;
    formData.use_custom_icon = true; // Use static icon
  }

  async function saveLink() {
    try {
      saving = true;
      
      if (!formData.name || !formData.url) {
        alert('Please fill in all required fields');
        return;
      }

      let linkData = { ...formData };
      delete linkData.id;

      if (formData.id) {
        // Update existing link
        const { error } = await supabase
          .from('social_links')
          .update(linkData)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Add new link
        linkData.branch_id = selectedBranchId;
        linkData.sort_order = socialLinks.length + 1;
        
        const { error } = await supabase
          .from('social_links')
          .insert([linkData]);

        if (error) throw error;
      }

      await loadSocialLinks();
      showAddForm = false;
      resetForm();
      
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link. Please try again.');
    } finally {
      saving = false;
    }
  }

  async function deleteLink(id) {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        const { error } = await supabase
          .from('social_links')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadSocialLinks();
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('Failed to delete link. Please try again.');
      }
    }
  }

  function editLink(link) {
    formData = { ...link };
    showAddForm = true;
  }
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Manage Social Media Links</h1>
  
  <!-- Branch Selection -->
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">Select Branch:</label>
    <select bind:value={selectedBranchId} on:change={loadSocialLinks} 
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
      {#each branches as branch}
        <option value={branch.id}>{branch.name}</option>
      {/each}
    </select>
  </div>

  <!-- Existing Links -->
  <div class="bg-white shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Current Social Links</h3>
      
      {#if socialLinks.length === 0}
        <p class="text-gray-500">No social links configured for this branch.</p>
      {:else}
        <div class="space-y-4">
          {#each socialLinks as link}
            <div class="flex items-center justify-between p-4 border rounded-lg">
              <div class="flex items-center space-x-4">
                <!-- Display static icon -->
                {#if link.use_custom_icon && link.static_icon}
                  <img src="/icons/social/{link.static_icon}" alt={link.name} 
                       class="w-8 h-8 object-contain rounded border" />
                {:else}
                  <span class="text-2xl">{link.icon}</span>
                {/if}
                <div>
                  <h4 class="font-medium">{link.name}</h4>
                  <p class="text-sm text-gray-500">{link.url}</p>
                </div>
              </div>
              
              <div class="flex space-x-2">
                <button on:click={() => editLink(link)}
                        class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Edit
                </button>
                <button on:click={() => deleteLink(link.id)}
                        class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      <button on:click={showAdd} 
              class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
        Add New Link
      </button>
    </div>
  </div>

  <!-- Add/Edit Form -->
  {#if showAddForm}
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {formData.id ? 'Edit' : 'Add'} Social Link
        </h3>
        
        <!-- Icon Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Icon:</label>
          <div class="grid grid-cols-3 gap-3">
            {#each availableIcons as iconOption}
              <button 
                type="button"
                on:click={() => selectIcon(iconOption)}
                class="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 
                       {formData.static_icon === iconOption.file ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}">
                <img src="/icons/social/{iconOption.file}" alt={iconOption.name} 
                     class="w-6 h-6 object-contain" 
                     on:error={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'inline'; }} />
                <span class="text-2xl" style="display: none;">{iconOption.emoji}</span>
                <span class="text-sm font-medium">{iconOption.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name:</label>
            <input bind:value={formData.name} 
                   class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL:</label>
            <input bind:value={formData.url} type="url" 
                   class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex space-x-3">
          <button on:click={saveLink} disabled={saving}
                  class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button on:click={cancelAdd}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
