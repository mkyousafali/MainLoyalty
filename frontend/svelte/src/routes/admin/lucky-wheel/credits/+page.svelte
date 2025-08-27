<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let creditTransactions: any[] = [];
  let totalCredits = 0;
  let pendingCredits = 0;
  let usedCredits = 0;
  
  onMount(() => {
    checkAdminAuth();
    loadCreditsData();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadCreditsData() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      totalCredits = 150;
      pendingCredits = 50;
      usedCredits = 100;
      
      creditTransactions = [
        {
          id: 1,
          customer_code: 'CUST001',
          customer_name: 'John Doe',
          amount: 25,
          type: 'earned',
          description: 'Lucky Wheel Prize',
          created_at: '2024-01-15T10:30:00Z',
          status: 'active'
        },
        {
          id: 2,
          customer_code: 'CUST002',
          customer_name: 'Jane Smith',
          amount: 10,
          type: 'used',
          description: 'Redeemed for discount',
          created_at: '2024-01-14T16:45:00Z',
          status: 'completed'
        }
      ];
    } catch (error) {
      console.error('Error loading credits data:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function adjustCredits(customerId: string, amount: number, reason: string) {
    // Placeholder function for credit adjustments
    console.log('Adjusting credits:', { customerId, amount, reason });
  }
</script>

<svelte:head>
  <title>Credits Management - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        💰 Credits Management
      </h1>
      <p class="text-gray-600 mt-2">Manage customer credits and transactions</p>
    </div>

    <!-- Credit Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-white text-lg font-semibold">Total Credits</h3>
            <p class="text-white text-3xl font-bold">¤{totalCredits}</p>
          </div>
          <div class="text-white text-4xl opacity-80">💳</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-white text-lg font-semibold">Pending Credits</h3>
            <p class="text-white text-3xl font-bold">¤{pendingCredits}</p>
          </div>
          <div class="text-white text-4xl opacity-80">⏳</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-white text-lg font-semibold">Used Credits</h3>
            <p class="text-white text-3xl font-bold">¤{usedCredits}</p>
          </div>
          <div class="text-white text-4xl opacity-80">✅</div>
        </div>
      </div>
    </div>

    <!-- Credit Adjustment Form -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Manual Credit Adjustment</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input 
          type="text" 
          placeholder="Customer Code" 
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <input 
          type="number" 
          placeholder="Amount" 
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <input 
          type="text" 
          placeholder="Reason" 
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <button class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Add/Deduct
        </button>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">Recent Credit Transactions</h2>
      </div>
      
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each creditTransactions as transaction}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
                      <div class="text-sm text-gray-500">{transaction.customer_code}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`text-sm font-medium ${
                      transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : '-'}¤{transaction.amount}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'earned' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.description}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {transaction.status}
                    </span>
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
