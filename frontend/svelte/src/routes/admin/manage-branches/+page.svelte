<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let branches: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';

  // Create/Edit modal
  let showModal = false;
  let editingBranch: any = null;
  let formData = {
    name: '',
    name_en: '',
    name_ar: '',
    location_en: '',
    location_ar: '',
    address: '',
    email: '',
    website: '',
    instagram: '',
    snapchat: '',
    tiktok: '',
    contact_number: '',
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    code: '',
    opening_hours: '',
    latitude: '',
    longitude: '',
    is_active: true
  };

  onMount(() => {
    loadBranches();
  });

  function handleRefresh() {
    loadBranches();
  }

  async function loadBranches() {
    try {
      isLoading = true;
      
      // First get all branches
      const { data: branchesData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .order('name_en');

      if (branchError) throw branchError;

      // Then get customer counts for each branch
      const branchesWithCounts = await Promise.all(
        (branchesData || []).map(async (branch) => {
          const { count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('nearest_branch_id', branch.id);
          
          return {
            ...branch,
            customers_count: count || 0
          };
        })
      );

      branches = branchesWithCounts;
    } catch (err: any) {
      error = `Failed to load branches: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingBranch = null;
    formData = {
      name: '',
      name_en: '',
      name_ar: '',
      location_en: '',
      location_ar: '',
      address: '',
      email: '',
      website: '',
      instagram: '',
      snapchat: '',
      tiktok: '',
      contact_number: '',
      manager_name: '',
      manager_phone: '',
      manager_email: '',
      code: '',
      opening_hours: '',
      latitude: '',
      longitude: '',
      is_active: true
    };
    showModal = true;
  }

  function openEditModal(branch: any) {
    editingBranch = branch;
    formData = {
      name: branch.name || '',
      name_en: branch.name_en || '',
      name_ar: branch.name_ar || '',
      location_en: branch.location_en || '',
      location_ar: branch.location_ar || '',
      address: branch.address || '',
      email: branch.email || '',
      website: branch.website || '',
      instagram: branch.instagram || '',
      snapchat: branch.snapchat || '',
      tiktok: branch.tiktok || '',
      contact_number: branch.contact_number || '',
      manager_name: branch.manager_name || '',
      manager_phone: branch.manager_phone || '',
      manager_email: branch.manager_email || '',
      code: branch.code || '',
      opening_hours: branch.opening_hours || '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      is_active: branch.is_active !== false
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingBranch = null;
    error = '';
    success = '';
  }

  async function saveBranch() {
    try {
      isLoading = true;

      const payload = {
        name: formData.name.trim() || formData.name_en.trim(),
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim() || null,
        location_en: formData.location_en.trim() || null,
        location_ar: formData.location_ar.trim() || null,
        address: formData.address.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        instagram: formData.instagram.trim() || null,
        snapchat: formData.snapchat.trim() || null,
        tiktok: formData.tiktok.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        manager_name: formData.manager_name.trim() || null,
        manager_phone: formData.manager_phone.trim() || null,
        manager_email: formData.manager_email.trim() || null,
        code: formData.code.trim() || null,
        opening_hours: formData.opening_hours.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        is_active: formData.is_active
      };

      if (editingBranch) {
        // Update existing branch
        const { error: updateError } = await supabase
          .from('branches')
          .update(payload)
          .eq('id', editingBranch.id);

        if (updateError) throw updateError;
        success = 'Branch updated successfully!';
      } else {
        // Create new branch
        const { error: insertError } = await supabase
          .from('branches')
          .insert(payload);

        if (insertError) throw insertError;
        success = 'Branch created successfully!';
      }

      closeModal();
      loadBranches();
    } catch (err: any) {
      error = `Failed to save branch: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function deleteBranch(branch: any) {
    if (!confirm(`Are you sure you want to delete "${branch.name_en}"? This action cannot be undone.`)) {
      return;
    }

    try {
      isLoading = true;

      const { error: deleteError } = await supabase
        .from('branches')
        .delete()
        .eq('id', branch.id);

      if (deleteError) throw deleteError;

      success = 'Branch deleted successfully!';
      loadBranches();
    } catch (err: any) {
      error = `Failed to delete branch: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function openSocialLink(url: string) {
    if (url && validateUrl(url)) {
      window.open(url, '_blank');
    }
  }
</script>

<div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Branch Management</h1>
          <p class="text-gray-600">Manage all branch locations, contact information, and social media links.</p>
        </div>
        <button
          on:click={openCreateModal}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Branch
        </button>
      </div>
    </div>

    <!-- Branches Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each branches as branch}
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{branch.name_en}</h3>
              {#if branch.name_ar}
                <p class="text-sm text-gray-600">{branch.name_ar}</p>
              {/if}
            </div>
            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          <!-- Contact Information -->
          <div class="space-y-3 mb-4">
            {#if branch.contact_number}
              <div class="flex items-center text-sm">
                <span class="text-gray-400 mr-2">📞</span>
                <span>{branch.contact_number}</span>
              </div>
            {/if}

            {#if branch.address}
              <div class="flex items-start text-sm">
                <span class="text-gray-400 mr-2 mt-0.5">📍</span>
                <span class="text-gray-600">{branch.address}</span>
              </div>
            {/if}
          </div>

          <!-- Social Media Links -->
          {#if branch.website || branch.instagram || branch.snapchat || branch.tiktok}
            <div class="flex space-x-3 mb-4">
              {#if branch.website}
                <button
                  on:click={() => openSocialLink(branch.website)}
                  class="text-blue-600 hover:text-blue-800"
                  title="Website"
                >
                  🌐
                </button>
              {/if}
              {#if branch.instagram}
                <button
                  on:click={() => openSocialLink(branch.instagram)}
                  class="text-pink-600 hover:text-pink-800"
                  title="Instagram"
                >
                  📷
                </button>
              {/if}
              {#if branch.snapchat}
                <button
                  on:click={() => openSocialLink(branch.snapchat)}
                  class="text-yellow-500 hover:text-yellow-700"
                  title="Snapchat"
                >
                  👻
                </button>
              {/if}
              {#if branch.tiktok}
                <button
                  on:click={() => openSocialLink(branch.tiktok)}
                  class="text-black hover:text-gray-700"
                  title="TikTok"
                >
                  🎵
                </button>
              {/if}
            </div>
          {/if}

          <!-- Statistics -->
          <div class="grid grid-cols-1 gap-4 mb-4 pt-4 border-t">
            <div class="text-center">
              <div class="text-lg font-bold text-blue-600">{branch.customers_count || 0}</div>
              <div class="text-xs text-gray-500">Customers</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-2">
            <button
              on:click={() => openEditModal(branch)}
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              on:click={() => deleteBranch(branch)}
              class="text-red-600 hover:text-red-800 text-sm font-medium"
              disabled={branch.customers_count > 0}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}

      {#if branches.length === 0 && !isLoading}
        <div class="col-span-full text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Branches</h3>
          <p class="text-gray-500 mb-4">Create your first branch to get started.</p>
          <button
            on:click={openCreateModal}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Branch
          </button>
        </div>
      {/if}
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">Loading branches...</p>
      </div>
    {/if}

    <!-- Create/Edit Modal -->
    {#if showModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-5 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {editingBranch ? 'Edit Branch' : 'Create Branch'}
            </h3>
            
            <form on:submit|preventDefault={saveBranch} class="space-y-4 max-h-96 overflow-y-auto">
              <!-- Basic Information -->
              <div class="border-b pb-4 mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Basic Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                    <input
                      type="text"
                      bind:value={formData.name_en}
                      required
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Main Branch"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                    <input
                      type="text"
                      bind:value={formData.name_ar}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., الفرع الرئيسي"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      bind:value={formData.code}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., MAIN001"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      bind:value={formData.email}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="branch@example.com"
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      bind:checked={formData.is_active}
                      class="mr-2"
                    />
                    Active Branch
                  </label>
                </div>
              </div>

              <!-- Location Information -->
              <div class="border-b pb-4 mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Location Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location (English)</label>
                    <input
                      type="text"
                      bind:value={formData.location_en}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Riyadh, Saudi Arabia"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location (Arabic)</label>
                    <input
                      type="text"
                      bind:value={formData.location_ar}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., الرياض، المملكة العربية السعودية"
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    bind:value={formData.address}
                    rows="2"
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full address..."
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      bind:value={formData.latitude}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="24.7136"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      bind:value={formData.longitude}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="46.6753"
                    />
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="border-b pb-4 mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Contact Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      bind:value={formData.contact_number}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., +966501234567"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
                    <input
                      type="text"
                      bind:value={formData.opening_hours}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 9:00 AM - 10:00 PM"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                    <input
                      type="text"
                      bind:value={formData.manager_name}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                    <input
                      type="tel"
                      bind:value={formData.manager_phone}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+966501234567"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                    <input
                      type="email"
                      bind:value={formData.manager_email}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="manager@example.com"
                    />
                  </div>
                </div>
              </div>

              <!-- Social Media -->
              <div class="pb-4">
                <h4 class="text-md font-medium text-gray-800 mb-3">Social Media & Website</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      bind:value={formData.website}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      bind:value={formData.instagram}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Snapchat URL</label>
                    <input
                      type="url"
                      bind:value={formData.snapchat}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://snapchat.com/add/username"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
                    <input
                      type="url"
                      bind:value={formData.tiktok}
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://tiktok.com/@username"
                    />
                  </div>
                </div>
              </div>
              
              <div class="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <button
                  type="button"
                  on:click={closeModal}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    {/if}

    <!-- Messages -->
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
        {success}
      </div>
    {/if}
  </div>
