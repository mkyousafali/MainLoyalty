<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let customerHistory: any[] = [];
  let searchTerm = '';
  let filteredHistory: any[] = [];
  
  onMount(() => {
    checkAdminAuth();
    loadCustomerHistory();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadCustomerHistory() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      customerHistory = [
        {
          id: 1,
          customer_code: 'CUST001',
          customer_name: 'John Doe',
          prize_amount: 25,
          prize_category: 'Discount Coupon',
          won_at: '2024-01-15T10:30:00Z',
          status: 'redeemed',
          redeemed_at: '2024-01-15T14:20:00Z'
        },
        {
          id: 2,
          customer_code: 'CUST002',
          customer_name: 'Jane Smith',
          prize_amount: 10,
          prize_category: 'Discount Coupon',
          won_at: '2024-01-14T16:45:00Z',
          status: 'active',
          redeemed_at: null
        }
      ];
      filteredHistory = customerHistory;
    } catch (error) {
      console.error('Error loading customer history:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function filterHistory() {
    if (!searchTerm.trim()) {
      filteredHistory = customerHistory;
    } else {
      filteredHistory = customerHistory.filter(record => 
        record.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }
  
  $: if (searchTerm !== undefined) filterHistory();
</script>

<svelte:head>
  <title>Customer Prize History - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        📝 Customer Prize History
      </h1>
      <p class="text-gray-600 mt-2">View and manage customer prize records</p>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex gap-4">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search by customer code or name..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Search
        </button>
      </div>
    </div>

    <!-- History Table -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      {#if isLoading}
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prize</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won At</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redeemed At</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredHistory as record}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{record.customer_name}</div>
                      <div class="text-sm text-gray-500">{record.customer_code}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-green-600">¤{record.prize_amount}</div>
                      <div class="text-sm text-gray-500">{record.prize_category}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.won_at).toLocaleString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'redeemed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : record.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.redeemed_at ? new Date(record.redeemed_at).toLocaleString() : '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>
