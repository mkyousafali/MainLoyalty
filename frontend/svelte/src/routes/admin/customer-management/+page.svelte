<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let customers: any[] = [];
  let branches: any[] = [];
  let cardTypes: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';

  // Filters
  let searchTerm = '';
  let selectedBranch = '';
  let selectedCardType = '';
  let selectedStatus = '';
  let sortBy = 'created_at';
  let sortOrder = 'desc';

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalCustomers = 0;

  // Edit modal
  let editingCustomer: any = null;
  let showEditModal = false;

  onMount(() => {
    loadInitialData();
    loadCustomers();
  });

  function handleRefresh() {
    loadInitialData();
    loadCustomers();
  }

  async function loadInitialData() {
    try {
      const [branchesRes, cardTypesRes] = await Promise.all([
        supabase.from('branches').select('*').order('name_en'),
        supabase.from('card_types').select('*').order('point_limit')
      ]);

      branches = branchesRes.data || [];
      cardTypes = cardTypesRes.data || [];
    } catch (err: any) {
      error = `Failed to load initial data: ${err.message}`;
    }
  }

  async function loadCustomers() {
    try {
      isLoading = true;
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          branches!nearest_branch_id(name_en),
          card_types(name_en, color)
        `, { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        query = query.or(`customer.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      if (selectedBranch) {
        query = query.eq('nearest_branch_id', selectedBranch);
      }
      if (selectedCardType) {
        query = query.eq('card_type_id', selectedCardType);
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: loadError, count } = await query;

      if (loadError) throw loadError;

      customers = data || [];
      totalCustomers = count || 0;
    } catch (err: any) {
      error = `Failed to load customers: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openEditModal(customer: any) {
    editingCustomer = { ...customer };
    showEditModal = true;
  }

  function closeEditModal() {
    editingCustomer = null;
    showEditModal = false;
    error = '';
    success = '';
  }

  async function saveCustomer() {
    try {
      isLoading = true;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: editingCustomer.name,
          email: editingCustomer.email,
          area: editingCustomer.area,
          points: parseInt(editingCustomer.points),
          status: editingCustomer.status,
          valid_until: editingCustomer.valid_until,
          card_type_id: editingCustomer.card_type_id
        })
        .eq('id', editingCustomer.id);

      if (updateError) throw updateError;

      success = 'Customer updated successfully!';
      closeEditModal();
      loadCustomers();
    } catch (err: any) {
      error = `Failed to update customer: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function toggleCustomerStatus(customer: any) {
    try {
      const newStatus = customer.status === 'active' ? 'blocked' : 'active';
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      success = `Customer ${newStatus === 'active' ? 'activated' : 'blocked'} successfully!`;
      loadCustomers();
    } catch (err: any) {
      error = `Failed to update customer status: ${err.message}`;
    }
  }

  function handleSort(column: string) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortOrder = 'asc';
    }
    loadCustomers();
  }

  function changePage(page: number) {
    currentPage = page;
    loadCustomers();
  }

  function applyFilters() {
    currentPage = 1;
    loadCustomers();
  }

  function clearFilters() {
    searchTerm = '';
    selectedBranch = '';
    selectedCardType = '';
    selectedStatus = '';
    currentPage = 1;
    loadCustomers();
  }

  $: totalPages = Math.ceil(totalCustomers / itemsPerPage);
</script>

<div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
      <p class="text-gray-600">Search, filter, and manage customer accounts, points, and status.</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Search & Filters</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Mobile, name, or email..."
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            bind:value={selectedBranch}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {#each branches as branch}
              <option value={branch.id}>{branch.name_en}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
          <select
            bind:value={selectedCardType}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Card Types</option>
            {#each cardTypes as cardType}
              <option value={cardType.id}>{cardType.name_en}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            bind:value={selectedStatus}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          on:click={applyFilters}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          on:click={clearFilters}
          class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Customer List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">
          Customers ({totalCustomers} total)
        </h2>
      </div>

      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading customers...</p>
        </div>
      {:else if customers.length === 0}
        <div class="p-8 text-center text-gray-500">
          No customers found matching your criteria.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    on:click={() => handleSort('customer')}>
                  Mobile {sortBy === 'customer' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    on:click={() => handleSort('name')}>
                  Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    on:click={() => handleSort('points')}>
                  Points {sortBy === 'points' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    on:click={() => handleSort('created_at')}>
                  Joined {sortBy === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each customers as customer}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {customer.customer}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div class="text-sm text-gray-500">{customer.email || 'No email'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          style="background-color: {customer.card_types?.color}20; color: {customer.card_types?.color}">
                      {customer.card_types?.name_en || 'No Card'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {customer.points}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.branches?.name_en || 'No Branch'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                 {customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                                   customer.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                                   'bg-gray-100 text-gray-800'}">
                      {customer.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      on:click={() => openEditModal(customer)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => toggleCustomerStatus(customer)}
                      class="{customer.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}"
                    >
                      {customer.status === 'active' ? 'Block' : 'Activate'}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                on:click={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                on:click={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  to <span class="font-medium">{Math.min(currentPage * itemsPerPage, totalCustomers)}</span>
                  of <span class="font-medium">{totalCustomers}</span> results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {#each Array(totalPages) as _, i}
                    <button
                      on:click={() => changePage(i + 1)}
                      class="relative inline-flex items-center px-4 py-2 border text-sm font-medium
                             {currentPage === i + 1 
                               ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                               : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                    >
                      {i + 1}
                    </button>
                  {/each}
                </nav>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Edit Modal -->
    {#if showEditModal && editingCustomer}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Customer</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  bind:value={editingCustomer.name}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  bind:value={editingCustomer.email}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input
                  type="text"
                  bind:value={editingCustomer.area}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  bind:value={editingCustomer.points}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                <select
                  bind:value={editingCustomer.card_type_id}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {#each cardTypes as cardType}
                    <option value={cardType.id}>{cardType.name_en}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  bind:value={editingCustomer.status}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  bind:value={editingCustomer.valid_until}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-2 mt-6">
              <button
                on:click={closeEditModal}
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                on:click={saveCustomer}
                disabled={isLoading}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
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
