<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let branches = [];
  let socialLinks = [];
  let selectedBranchId = '';
  let loadingBranches = false;
  let loadingSocialLinks = false;
  let showAddForm = false;
  let editingId = null;

  // Available static icons
  const availableIcons = [
    { name: 'Facebook', emoji: '📘', file: 'facebook.png' },
    { name: 'Instagram', emoji: '📸', file: 'instagram.png' },
    { name: 'Twitter', emoji: '🐦', file: 'twitter.png' },
    { name: 'LinkedIn', emoji: '💼', file: 'linkedin.png' },
    { name: 'YouTube', emoji: '📺', file: 'youtube.png' },
    { name: 'TikTok', emoji: '🎵', file: 'tiktok.png' },
    { name: 'WhatsApp', emoji: '💬', file: 'whatsapp.png' },
    { name: 'Telegram', emoji: '✈️', file: 'telegram.png' },
    { name: 'Snapchat', emoji: '👻', file: 'snapchat.png' }
  ];

  let formData = {
    id: null,
    branch_id: '',
    name: '',
    url: '',
    icon: '📘',
    static_icon: 'facebook.png',
    use_custom_icon: true,
    is_active: true,
    sort_order: 0
  };

  onMount(async () => {
    loadBranches();
    loadSocialLinks();
  });

  async function loadBranches() {
    try {
      loadingBranches = true;
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      branches = data || [];
    } catch (error) {
      console.error('Error loading branches:', error);
      branches = [];
    } finally {
      loadingBranches = false;
    }
  }

  // Handle icon selection
  function selectIcon(iconData) {
    formData.name = iconData.name;
    formData.icon = iconData.emoji;
    formData.static_icon = iconData.file;
    formData.use_custom_icon = true;
  }

  function resetForm() {
    formData = {
      id: null,
      branch_id: '',
      name: '',
      url: '',
      icon: '📘',
      static_icon: 'facebook.png',
      use_custom_icon: true,
      is_active: true,
      sort_order: 0
    };
    editingId = null;
  }

  async function loadSocialLinks() {
    if (!selectedBranchId) {
      socialLinks = [];
      return;
    }

    try {
      loadingSocialLinks = true;
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('branch_id', selectedBranchId)
        .order('sort_order');

      if (error) throw error;
      socialLinks = data || [];
    } catch (error) {
      console.error('Error loading social links:', error);
      socialLinks = [];
    } finally {
      loadingSocialLinks = false;
    }
  }

  function addLink() {
    resetForm();
    showAddForm = true;
  }

  function editLink(link) {
    formData = {
      id: link.id,
      branch_id: link.branch_id,
      name: link.name,
      url: link.url,
      icon: link.icon,
      static_icon: link.static_icon || 'facebook.png',
      use_custom_icon: link.use_custom_icon || true,
      is_active: link.is_active,
      sort_order: link.sort_order
    };
    editingId = link.id;
    showAddForm = true;
  }

  function cancelEdit() {
    resetForm();
    showAddForm = false;
  }

  async function saveLink() {
    try {
      if (!formData.name.trim() || !formData.url.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.use_custom_icon && !formData.static_icon) {
        alert('Please select an icon from the grid');
        return;
      }

      let linkData = { ...formData };

      // Remove temporary fields
      delete linkData.id;

      if (editingId) {
        // Update existing link in database
        const { error } = await supabase
          .from('social_links')
          .update(linkData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Add new link to database
        linkData.branch_id = selectedBranchId;
        linkData.sort_order = socialLinks.length + 1;
        
        const { error } = await supabase
          .from('social_links')
          .insert([linkData]);

        if (error) throw error;
      }

      // Reload data from database
      await loadSocialLinks();
      showAddForm = false;
      resetForm();
      
    } catch (error) {
      console.error('Error saving social link:', error);
      alert('Error saving social link: ' + error.message);
    }
  }

  async function deleteLink(linkId) {
    if (!confirm('Are you sure you want to delete this social link?')) return;

    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      await loadSocialLinks();
    } catch (error) {
      console.error('Error deleting social link:', error);
      alert('Error deleting social link: ' + error.message);
    }
  }

  // Watch for branch changes
  $: if (selectedBranchId) {
    loadSocialLinks();
  }
</script>

<div class="max-w-6xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Manage Social Links</h1>

  <!-- Branch Selection -->
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
    {#if loadingBranches}
      <div class="text-gray-500">Loading branches...</div>
    {:else}
      <select bind:value={selectedBranchId} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        <option value="">Choose a branch...</option>
        {#each branches as branch}
          <option value={branch.id}>{branch.name}</option>
        {/each}
      </select>
    {/if}
  </div>

  {#if selectedBranchId}
    <!-- Add Link Button -->
    <div class="mb-6">
      <button 
        on:click={addLink}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Social Link
      </button>
    </div>

    <!-- Add/Edit Form -->
    {#if showAddForm}
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">
          {editingId ? 'Edit' : 'Add'} Social Link
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
            <input 
              type="text" 
              bind:value={formData.name}
              placeholder="e.g., Facebook"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
            <input 
              type="url" 
              bind:value={formData.url}
              placeholder="https://facebook.com/yourpage"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Icon Selection Grid -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Icon</label>
          <div class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {#each availableIcons as iconOption}
              <button
                type="button"
                on:click={() => selectIcon(iconOption)}
                class="flex flex-col items-center p-3 border rounded-lg hover:bg-blue-50 transition-colors
                       {formData.static_icon === iconOption.file ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
              >
                <img 
                  src="/icons/social/{iconOption.file}" 
                  alt={iconOption.name}
                  class="w-8 h-8 mb-1 object-contain"
                  on:error={() => console.log(`Icon not found: ${iconOption.file}`)}
                />
                <span class="text-xs text-gray-600">{iconOption.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-2">
          <button 
            on:click={saveLink}
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {editingId ? 'Update' : 'Save'} Link
          </button>
          <button 
            on:click={cancelEdit}
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}

    <!-- Existing Links -->
    <div class="bg-white border border-gray-200 rounded-lg">
      <h3 class="text-lg font-semibold p-4 border-b">Current Social Links</h3>
      
      {#if loadingSocialLinks}
        <div class="p-4 text-gray-500">Loading social links...</div>
      {:else if socialLinks.length === 0}
        <div class="p-4 text-gray-500">No social links found for this branch.</div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each socialLinks as link}
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                {#if link.static_icon}
                  <img 
                    src="/icons/social/{link.static_icon}" 
                    alt={link.name}
                    class="w-8 h-8 object-contain"
                    on:error={() => console.log(`Icon not found: ${link.static_icon}`)}
                  />
                {:else}
                  <span class="text-2xl">{link.icon}</span>
                {/if}
                <div>
                  <div class="font-medium">{link.name}</div>
                  <div class="text-sm text-gray-500">{link.url}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">#{link.sort_order}</span>
                <button 
                  on:click={() => editLink(link)}
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button 
                  on:click={() => deleteLink(link.id)}
                  class="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-gray-500 text-center py-8">
      Please select a branch to manage social links.
    </div>
  {/if}
</div>
