<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let selectedCoupon = '';
  let assignmentType = 'individual'; // 'individual', 'bulk', 'all'
  let selectedCustomers: string[] = [];
  let searchQuery = '';
  let isLoading = false;
  let successMessage = '';
  let errorMessage = '';

  let availableCoupons: any[] = [];
  let allCustomers: any[] = [];

  onMount(() => {
    loadData();
  });

  async function loadData() {
    isLoading = true;
    try {
      // Load coupons
      const couponsResult = await supabase
        .from('coupons')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (couponsResult.data) {
        availableCoupons = couponsResult.data.map(coupon => ({
          id: coupon.id,
          code: coupon.code,
          description: coupon.value, // Using value as description since schema doesn't have description
          expiresAt: coupon.expires_at,
          type: coupon.type
        }));
      }

      // Load customers
      const customersResult = await supabase
        .from('customers')
        .select('id, customer, name, area, points, card_type_id, card_types(name_en)')
        .eq('status', 'active')
        .order('name');

      if (customersResult.data) {
        allCustomers = customersResult.data.map(customer => ({
          id: customer.id,
          name: customer.name,
          mobile: customer.customer, // Using customer number as mobile
          cardType: customer.card_types?.name_en || 'Bronze',
          points: customer.points
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      errorMessage = 'Failed to load data. Please refresh the page.';
    } finally {
      isLoading = false;
    }
  }

  $: filteredCustomers = allCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobile.includes(searchQuery) ||
    customer.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: validCoupons = availableCoupons.filter(coupon => 
    new Date(coupon.expiresAt) > new Date()
  );

  function toggleCustomerSelection(customerId: string) {
    if (selectedCustomers.includes(customerId)) {
      selectedCustomers = selectedCustomers.filter(id => id !== customerId);
    } else {
      selectedCustomers = [...selectedCustomers, customerId];
    }
  }

  function selectAllCustomers() {
    selectedCustomers = filteredCustomers.map(customer => customer.id);
  }

  function clearSelection() {
    selectedCustomers = [];
  }

  async function assignCoupons() {
    if (!selectedCoupon) {
      errorMessage = 'Please select a coupon to assign';
      return;
    }

    if (assignmentType !== 'all' && selectedCustomers.length === 0) {
      errorMessage = 'Please select at least one customer';
      return;
    }

    isLoading = true;
    errorMessage = '';
    
    try {
      const selectedCouponData = availableCoupons.find(c => c.id === selectedCoupon);
      
      // Determine which customers to assign to
      let targetCustomers = [];
      if (assignmentType === 'all') {
        targetCustomers = allCustomers.map(c => c.id);
      } else {
        targetCustomers = selectedCustomers;
      }

      // Create coupon_usage records for each target customer
      const usageRecords = targetCustomers.map(customerId => ({
        coupon_id: selectedCoupon,
        customer_id: customerId,
        status: 'unused',
        assigned_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('coupon_usage')
        .insert(usageRecords);

      if (error) throw error;

      const assignedCount = targetCustomers.length;
      successMessage = `Successfully assigned "${selectedCouponData?.description}" to ${assignedCount} customers`;

      // Reset form
      selectedCoupon = '';
      selectedCustomers = [];
      assignmentType = 'individual';
      searchQuery = '';
      
    } catch (error) {
      console.error('Error assigning coupons:', error);
      errorMessage = 'Failed to assign coupons. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Clear messages after 5 seconds
    const interval = setInterval(() => {
      if (successMessage) successMessage = '';
      if (errorMessage) errorMessage = '';
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<div class="min-h-screen bg-gray-50 p-4 md:p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Assign Coupons</h1>
      <p class="text-gray-600">Assign coupons to individual customers, bulk selection, or all customers</p>
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
      <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        <div class="flex items-center">
          <span class="text-green-500 mr-2">✅</span>
          {successMessage}
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div class="flex items-center">
          <span class="text-red-500 mr-2">❌</span>
          {errorMessage}
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Coupon Selection -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="text-blue-500 mr-2">🎟️</span>
            Select Coupon
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Available Coupons</label>
              <select 
                bind:value={selectedCoupon}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a coupon...</option>
                {#each validCoupons as coupon}
                  <option value={coupon.id}>{coupon.code} - {coupon.description}</option>
                {/each}
              </select>
            </div>

            {#if selectedCoupon}
              {@const couponData = validCoupons.find(c => c.id === selectedCoupon)}
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-medium text-blue-900 mb-2">{couponData?.code}</h3>
                <p class="text-blue-700 text-sm mb-2">{couponData?.description}</p>
                <p class="text-blue-600 text-xs">Expires: {new Date(couponData?.expiresAt || '').toLocaleDateString()}</p>
              </div>
            {/if}

            <!-- Assignment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="radio" bind:group={assignmentType} value="individual" class="mr-2">
                  <span class="text-sm">Individual Selection</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" bind:group={assignmentType} value="bulk" class="mr-2">
                  <span class="text-sm">Bulk Selection</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" bind:group={assignmentType} value="all" class="mr-2">
                  <span class="text-sm">All Customers</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Selection -->
      <div class="lg:col-span-2">
        {#if assignmentType !== 'all'}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 flex items-center mb-2 sm:mb-0">
                <span class="text-green-500 mr-2">👥</span>
                Select Customers
              </h2>
              <div class="text-sm text-gray-500">
                {selectedCustomers.length} of {filteredCustomers.length} selected
              </div>
            </div>

            <!-- Search and Actions -->
            <div class="flex flex-col sm:flex-row gap-3 mb-4">
              <div class="flex-1">
                <input
                  type="text"
                  bind:value={searchQuery}
                  placeholder="Search by name, mobile, or customer ID..."
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
              </div>
              <div class="flex gap-2">
                <button
                  on:click={selectAllCustomers}
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                >
                  Select All
                </button>
                <button
                  on:click={clearSelection}
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Customer Table -->
            <div class="overflow-x-auto">
              <div class="max-h-96 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th class="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                          on:change={selectedCustomers.length === filteredCustomers.length ? clearSelection : selectAllCustomers}
                          class="rounded"
                        >
                      </th>
                      <th class="px-4 py-3 text-left font-medium text-gray-700">Customer ID</th>
                      <th class="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                      <th class="px-4 py-3 text-left font-medium text-gray-700">Mobile</th>
                      <th class="px-4 py-3 text-left font-medium text-gray-700">Card Type</th>
                      <th class="px-4 py-3 text-left font-medium text-gray-700">Points</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {#each filteredCustomers as customer}
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            on:change={() => toggleCustomerSelection(customer.id)}
                            class="rounded"
                          >
                        </td>
                        <td class="px-4 py-3 font-mono text-xs">{customer.id}</td>
                        <td class="px-4 py-3 font-medium">{customer.name}</td>
                        <td class="px-4 py-3 font-mono">{customer.mobile}</td>
                        <td class="px-4 py-3">
                          <span class="px-2 py-1 rounded-full text-xs font-medium
                            {customer.cardType === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                             customer.cardType === 'Silver' ? 'bg-gray-100 text-gray-800' :
                             'bg-orange-100 text-orange-800'}">
                            {customer.cardType}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-gray-600">{customer.points.toLocaleString()}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>

            {#if filteredCustomers.length === 0}
              <div class="text-center py-8 text-gray-500">
                <span class="text-4xl mb-2 block">🔍</span>
                No customers found matching your search
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="text-center py-8">
              <span class="text-6xl mb-4 block">🌐</span>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Assign to All Customers</h3>
              <p class="text-gray-600 mb-4">This coupon will be assigned to all {allCustomers.length} customers in the system</p>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                <p class="text-blue-700 text-sm">All current and future customers will receive this coupon</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Action Button -->
    <div class="mt-6 flex justify-center">
      <button
        on:click={assignCoupons}
        disabled={isLoading || !selectedCoupon || (assignmentType !== 'all' && selectedCustomers.length === 0)}
        class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-lg font-medium"
      >
        {#if isLoading}
          <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          Assigning...
        {:else}
          <span class="text-xl">🎯</span>
          Assign Coupon
          {#if assignmentType === 'all'}
            to All Customers
          {:else if selectedCustomers.length > 0}
            to {selectedCustomers.length} Customer{selectedCustomers.length > 1 ? 's' : ''}
          {/if}
        {/if}
      </button>
    </div>
  </div>
</div>
