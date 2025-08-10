<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  // State
  let offers: any[] = [];
  let branches: any[] = [];
  let loading = false;
  let searchQuery = '';
  let selectedBranch = '';
  let statusFilter = 'all'; // all, active, expired, inactive
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalOffers = 0;

  // Create offer modal state
  let showCreateModal = false;
  let creating = false;

  // Create offer form data
  let newOffer = {
    title: '',
    description: '',
    selectedBranchId: '',
    discountPercentage: 0,
    discountAmount: 0,
    minimumPurchase: 0,
    validFrom: '',
    validUntil: '',
    termsConditions: '',
    maxRedemptions: 0,
    isActive: true
  };

  // File handling for create modal
  let createImageFile: File | null = null;
  let createPdfFile: File | null = null;
  let createImagePreview = '';
  let createPdfPreview = '';

  onMount(async () => {
    console.log('Offers Management page mounted');
    setDefaultDates();
    await Promise.all([loadBranches(), loadOffers()]);

    // Add escape key listener for modal
    const handleKeydown = (event: KeyboardEvent) => {
      if (showCreateModal && event.key === 'Escape') {
        closeCreateModal();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    
    // Cleanup listener on component destroy
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    newOffer.validFrom = today;
    newOffer.validUntil = nextMonthStr;
  }

  function openCreateModal() {
    console.log('🚀 BUTTON CLICKED - Opening create modal...');
    console.log('Current showCreateModal state:', showCreateModal);
    resetCreateForm();
    showCreateModal = true;
    console.log('Modal state after setting to true:', showCreateModal);
    console.log('DOM should now show modal');
    
    // Force a re-render check
    setTimeout(() => {
      console.log('Timeout check - Modal should be visible:', showCreateModal);
    }, 100);
  }

  function closeCreateModal() {
    showCreateModal = false;
    resetCreateForm();
  }

  function resetCreateForm() {
    newOffer = {
      title: '',
      description: '',
      selectedBranchId: '',
      discountPercentage: 0,
      discountAmount: 0,
      minimumPurchase: 0,
      validFrom: '',
      validUntil: '',
      termsConditions: '',
      maxRedemptions: 0,
      isActive: true
    };
    createImageFile = null;
    createPdfFile = null;
    createImagePreview = '';
    createPdfPreview = '';
    setDefaultDates();
  }

  function handleCreateImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file (PNG, JPG, JPEG)', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Image file size must be less than 5MB', 'error');
        return;
      }
      
      createImageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        createImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handleCreatePdfUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        showMessage('Please select a valid PDF file', 'error');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showMessage('PDF file size must be less than 10MB', 'error');
        return;
      }
      
      createPdfFile = file;
      createPdfPreview = file.name;
    }
  }

  function removeCreateImage() {
    createImageFile = null;
    createImagePreview = '';
  }

  function removeCreatePdf() {
    createPdfFile = null;
    createPdfPreview = '';
  }

  async function uploadFile(file: File, bucket: string, fileName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading ${bucket}:`, error);
      return null;
    }
  }

  async function createNewOffer() {
    console.log('Create new offer called with data:', newOffer);
    
    // Validation with better visual feedback
    if (!newOffer.title?.trim()) {
      showMessage('Please enter an offer title', 'error');
      document.getElementById('createTitle')?.focus();
      return;
    }
    
    if (!newOffer.validUntil) {
      showMessage('Please select a valid until date', 'error');
      document.getElementById('createValidUntil')?.focus();
      return;
    }

    // Check if valid until is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (newOffer.validUntil < today) {
      showMessage('Valid until date cannot be in the past', 'error');
      document.getElementById('createValidUntil')?.focus();
      return;
    }

    try {
      creating = true;
      console.log('Starting offer creation...');
      
      let imageUrl = '';
      let pdfUrl = '';

      // Upload image if selected
      if (createImageFile) {
        console.log('Uploading image file:', createImageFile.name);
        const fileName = `offer-${Date.now()}.${createImageFile.name.split('.').pop()}`;
        imageUrl = await uploadFile(createImageFile, 'offer-images', fileName) || '';
        console.log('Image uploaded, URL:', imageUrl);
      }

      // Upload PDF if selected
      if (createPdfFile) {
        console.log('Uploading PDF file:', createPdfFile.name);
        const fileName = `offer-${Date.now()}.pdf`;
        pdfUrl = await uploadFile(createPdfFile, 'offer-pdfs', fileName) || '';
        console.log('PDF uploaded, URL:', pdfUrl);
      }

      // Prepare data for database
      const offerData = {
        title: newOffer.title.trim(),
        description: newOffer.description?.trim() || null,
        branch_id: newOffer.selectedBranchId || null,
        discount_percentage: Number(newOffer.discountPercentage) || 0,
        discount_amount: Number(newOffer.discountAmount) || 0,
        minimum_purchase: Number(newOffer.minimumPurchase) || 0,
        valid_from: newOffer.validFrom || new Date().toISOString().split('T')[0],
        valid_until: newOffer.validUntil,
        image_url: imageUrl || null,
        pdf_url: pdfUrl || null,
        terms_conditions: newOffer.termsConditions?.trim() || null,
        max_redemptions: newOffer.maxRedemptions ? Number(newOffer.maxRedemptions) : null,
        is_active: Boolean(newOffer.isActive),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting offer data:', offerData);

      // Create offer in database
      const { data, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Offer created successfully:', data);
      showMessage('Offer created successfully! 🎉', 'success');
      closeCreateModal();
      await loadOffers(); // Refresh the list

    } catch (error) {
      console.error('Error creating offer:', error);
      showMessage(`Failed to create offer: ${error.message}`, 'error');
    } finally {
      creating = false;
    }
  }

  async function loadBranches() {
    try {
      console.log('Loading branches for filter dropdown...');
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) {
        console.error('Error loading branches:', error);
        throw error;
      }
      
      console.log('Branches loaded:', data?.length || 0);
      branches = (data || []).map(branch => {
        const branchName = branch.branch_name || branch.name || branch.title || `Branch ${branch.id?.slice(0,8)}`;
        return {
          id: branch.id,
          name: branchName
        };
      });
    } catch (error) {
      console.error('Error loading branches:', error);
      showMessage(`Failed to load branches: ${error.message}`, 'error');
    }
  }

  async function loadOffers() {
    try {
      loading = true;
      console.log('Loading offers with filters:', { selectedBranch, statusFilter, searchQuery });
      
      // Build the query with proper column selection
      let query = supabase
        .from('offers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true).gte('valid_until', new Date().toISOString().split('T')[0]);
      } else if (statusFilter === 'expired') {
        query = query.lt('valid_until', new Date().toISOString().split('T')[0]);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply search
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Loaded offers:', data?.length || 0);
      offers = data || [];
      totalOffers = count || 0;

      // Load branch information separately for each offer that has a branch_id
      if (offers.length > 0) {
        await loadBranchInfoForOffers();
      }
    } catch (error) {
      console.error('Error loading offers:', error);
      showMessage(`Failed to load offers: ${error.message}`, 'error');
    } finally {
      loading = false;
    }
  }

  async function loadBranchInfoForOffers() {
    try {
      const branchIds = offers
        .filter(offer => offer.branch_id)
        .map(offer => offer.branch_id);
      
      if (branchIds.length === 0) return;

      const { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .in('id', branchIds);

      if (error) {
        console.error('Error loading branch info:', error);
        return;
      }

      // Create a map of branch_id to branch info
      const branchMap = new Map();
      branchData?.forEach(branch => {
        const branchName = branch.branch_name || branch.name || branch.title || `Branch ${branch.id?.slice(0,8)}`;
        branchMap.set(branch.id, { ...branch, display_name: branchName });
      });

      // Add branch info to offers
      offers = offers.map(offer => ({
        ...offer,
        branch_info: offer.branch_id ? branchMap.get(offer.branch_id) : null
      }));

    } catch (error) {
      console.error('Error loading branch info:', error);
    }
  }

  async function deleteOffer(offerId: string, offerTitle: string) {
    if (!confirm(`Are you sure you want to delete "${offerTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      showMessage('Offer deleted successfully', 'success');
      await loadOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      showMessage('Failed to delete offer', 'error');
    }
  }

  async function toggleOfferStatus(offerId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;

      showMessage(`Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      await loadOffers();
    } catch (error) {
      console.error('Error updating offer status:', error);
      showMessage('Failed to update offer status', 'error');
    }
  }

  function showMessage(text: string, type: 'success' | 'error') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }

  function getOfferStatus(offer: any): { label: string, color: string } {
    const now = new Date();
    const validUntil = new Date(offer.valid_until);
    
    if (!offer.is_active) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (validUntil < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  }

  function getBranchName(offer: any): string {
    if (offer.branch_info) {
      return offer.branch_info.display_name || 'Unknown Branch';
    }
    return offer.branch_id ? 'Loading...' : 'All Branches';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Reactive statements for filtering
  $: if (searchQuery !== undefined || selectedBranch !== undefined || statusFilter !== undefined || itemsPerPage !== undefined) {
    currentPage = 1; // Reset to first page when filters change
    if (typeof window !== 'undefined') {
      // Only call loadOffers after component is mounted
      loadOffers();
    }
  }

  // Debug reactive statement for modal
  $: if (showCreateModal !== undefined) {
    console.log('🎭 MODAL STATE CHANGED:', showCreateModal);
  }

  // Pagination helpers
  $: totalPages = Math.ceil(totalOffers / itemsPerPage);
  $: hasNextPage = currentPage < totalPages;
  $: hasPrevPage = currentPage > 1;
</script>

<svelte:head>
  <title>Offers Management - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Offers Management</h1>
        <p class="text-gray-600 mt-2">Manage all store offers and promotions</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Search Offers
          </label>
          <input
            type="text"
            id="search"
            bind:value={searchQuery}
            placeholder="Search by title or description..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Branch Filter -->
        <div>
          <label for="branchFilter" class="block text-sm font-medium text-gray-700 mb-2">
            Branch ({branches.length} loaded)
          </label>
          <select
            id="branchFilter"
            bind:value={selectedBranch}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {#each branches as branch}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-2">
            Status ({totalOffers} total)
          </label>
          <select
            id="statusFilter"
            bind:value={statusFilter}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <!-- Items per page -->
        <div>
          <label for="itemsPerPage" class="block text-sm font-medium text-gray-700 mb-2">
            Items per page
          </label>
          <select
            id="itemsPerPage"
            bind:value={itemsPerPage}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Offers Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      {#if loading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-4">Loading offers...</p>
        </div>
      {:else if offers.length === 0}
        <div class="p-8 text-center">
          <div class="text-gray-400 text-6xl mb-4">📋</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No offers found</h3>
          <p class="text-gray-600 mb-4">
            {searchQuery || selectedBranch || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Use the Create Offer page to add your first offer'}
          </p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each offers as offer}
                {@const status = getOfferStatus(offer)}
                <tr class="hover:bg-gray-50">
                  <!-- Offer Info -->
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      {#if offer.image_url}
                        <img src={offer.image_url} alt={offer.title} class="w-12 h-12 rounded-lg object-cover mr-4" />
                      {:else}
                        <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4 text-gray-400">
                          📷
                        </div>
                      {/if}
                      <div>
                        <div class="text-sm font-medium text-gray-900">{offer.title}</div>
                        {#if offer.description}
                          <div class="text-sm text-gray-500">{offer.description.slice(0, 60)}...</div>
                        {/if}
                      </div>
                    </div>
                  </td>

                  <!-- Branch -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBranchName(offer)}
                  </td>

                  <!-- Discount -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {#if offer.discount_percentage > 0}
                      {offer.discount_percentage}% off
                    {:else if offer.discount_amount > 0}
                      {offer.discount_amount} SAR off
                    {:else}
                      No discount
                    {/if}
                  </td>

                  <!-- Valid Until -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(offer.valid_until)}
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {status.color}">
                      {status.label}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <!-- Edit Button -->
                      <button
                        on:click={() => goto(`/admin/edit-offer/${offer.id}`)}
                        class="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit Offer"
                      >
                        ✏️
                      </button>

                      <!-- Toggle Status Button -->
                      <button
                        on:click={() => toggleOfferStatus(offer.id, offer.is_active)}
                        class="text-gray-600 hover:text-gray-800 transition-colors p-1"
                        title="{offer.is_active ? 'Deactivate' : 'Activate'} Offer"
                      >
                        {offer.is_active ? '🔽' : '🔼'}
                      </button>

                      <!-- Delete Button -->
                      <button
                        on:click={() => deleteOffer(offer.id, offer.title)}
                        class="text-red-600 hover:text-red-800 transition-colors p-1"
                        title="Delete Offer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalOffers)} of {totalOffers} offers
              </div>
              <div class="flex items-center space-x-2">
                <button
                  on:click={() => currentPage = Math.max(1, currentPage - 1)}
                  disabled={!hasPrevPage}
                  class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                >
                  Previous
                </button>
                
                <span class="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
                  disabled={!hasNextPage}
                  class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Create Offer Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div 
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          on:click={closeCreateModal}
        ></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded-xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div class="absolute top-0 right-0 pt-4 pr-4">
            <button
              on:click={closeCreateModal}
              class="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Create New Offer</h1>
            <p class="text-gray-600 mt-2">Create a new promotional offer for your customers</p>
          </div>

          <!-- Modal content with scrollable form -->
          <div class="max-h-96 overflow-y-auto pr-2">
            <form on:submit|preventDefault={createNewOffer} class="space-y-8">
              <!-- Basic Information Section -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span class="text-blue-600 mr-2">📝</span>
                  Basic Information
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="createTitle" class="block text-sm font-medium text-gray-700 mb-2">
                      Offer Title *
                    </label>
                    <input
                      type="text"
                      id="createTitle"
                      bind:value={newOffer.title}
                      required
                      placeholder="e.g., Summer Sale - 25% Off"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label for="createBranch" class="block text-sm font-medium text-gray-700 mb-2">
                      Target Branch
                    </label>
                    <select
                      id="createBranch"
                      bind:value={newOffer.selectedBranchId}
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Branches</option>
                      {#each branches as branch}
                        <option value={branch.id}>{branch.name}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <div class="mt-6">
                  <label for="createDescription" class="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="createDescription"
                    bind:value={newOffer.description}
                    rows="3"
                    placeholder="Describe the offer details..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ></textarea>
                </div>
              </div>

              <!-- Discount Settings Section -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span class="text-green-600 mr-2">💰</span>
                  Discount Settings
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label for="createDiscountPercentage" class="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage
                    </label>
                    <div class="relative">
                      <input
                        type="number"
                        id="createDiscountPercentage"
                        bind:value={newOffer.discountPercentage}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="25"
                        class="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span class="absolute right-3 top-3 text-gray-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label for="createDiscountAmount" class="block text-sm font-medium text-gray-700 mb-2">
                      Fixed Discount Amount
                    </label>
                    <div class="relative">
                      <input
                        type="number"
                        id="createDiscountAmount"
                        bind:value={newOffer.discountAmount}
                        min="0"
                        step="0.01"
                        placeholder="50"
                        class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span class="absolute right-3 top-3 text-gray-500">SAR</span>
                    </div>
                  </div>

                  <div>
                    <label for="createMinimumPurchase" class="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase
                    </label>
                    <div class="relative">
                      <input
                        type="number"
                        id="createMinimumPurchase"
                        bind:value={newOffer.minimumPurchase}
                        min="0"
                        step="0.01"
                        placeholder="100"
                        class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span class="absolute right-3 top-3 text-gray-500">SAR</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Validity Period Section -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span class="text-purple-600 mr-2">📅</span>
                  Validity Period
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="createValidFrom" class="block text-sm font-medium text-gray-700 mb-2">
                      Valid From
                    </label>
                    <input
                      type="date"
                      id="createValidFrom"
                      bind:value={newOffer.validFrom}
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label for="createValidUntil" class="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until *
                    </label>
                    <input
                      type="date"
                      id="createValidUntil"
                      bind:value={newOffer.validUntil}
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <!-- File Uploads Section -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span class="text-orange-600 mr-2">📎</span>
                  Visual Content
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <!-- Image Upload -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                      Offer Image (PNG, JPG - Max 5MB)
                    </label>
                    
                    {#if createImagePreview}
                      <div class="relative mb-3">
                        <img src={createImagePreview} alt="Offer preview" class="w-full h-48 object-cover rounded-lg border" />
                        <button
                          type="button"
                          on:click={removeCreateImage}
                          class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    {:else}
                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <div class="text-gray-400 mb-2 text-4xl">📷</div>
                        <p class="text-sm text-gray-600 mb-4">Upload an image for your offer</p>
                      </div>
                    {/if}

                    <input
                      type="file"
                      accept="image/*"
                      on:change={handleCreateImageUpload}
                      class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <!-- PDF Upload -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                      Offer Details PDF (Max 10MB)
                    </label>
                    
                    {#if createPdfPreview}
                      <div class="border rounded-lg p-4 bg-gray-50 mb-3">
                        <div class="flex items-center space-x-3">
                          <span class="text-red-600 text-2xl">📄</span>
                          <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">{createPdfPreview}</p>
                            <p class="text-xs text-gray-500">PDF Document</p>
                          </div>
                          <button
                            type="button"
                            on:click={removeCreatePdf}
                            class="text-red-500 hover:text-red-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    {:else}
                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <div class="text-gray-400 mb-2 text-4xl">📄</div>
                        <p class="text-sm text-gray-600 mb-4">Upload a PDF with offer details</p>
                      </div>
                    {/if}

                    <input
                      type="file"
                      accept=".pdf"
                      on:change={handleCreatePdfUpload}
                      class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              <!-- Additional Settings Section -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span class="text-gray-600 mr-2">⚙️</span>
                  Additional Settings
                </h2>

                <div class="space-y-6">
                  <div>
                    <label for="createMaxRedemptions" class="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Redemptions (Optional)
                    </label>
                    <input
                      type="number"
                      id="createMaxRedemptions"
                      bind:value={newOffer.maxRedemptions}
                      min="0"
                      placeholder="Leave empty for unlimited"
                      class="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label for="createTermsConditions" class="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      id="createTermsConditions"
                      bind:value={newOffer.termsConditions}
                      rows="4"
                      placeholder="Enter terms and conditions for this offer..."
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="createIsActive"
                      bind:checked={newOffer.isActive}
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label for="createIsActive" class="ml-2 text-sm font-medium text-gray-700">
                      Offer is active and visible to customers
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Actions -->
          <div class="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              on:click={closeCreateModal}
              class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="button"
              on:click={createNewOffer}
              disabled={creating}
              class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              {#if creating}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              {:else}
                <span>Create Offer</span>
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Success/Error Messages -->
  {#if message}
    <div class="fixed top-4 right-4 z-50 max-w-sm">
      <div class="rounded-lg p-4 shadow-lg {messageType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
        {message}
      </div>
    </div>
  {/if}
</div>
