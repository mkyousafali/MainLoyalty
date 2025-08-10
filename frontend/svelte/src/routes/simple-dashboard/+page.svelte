<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { browser } from '$app/environment';

  let customerData: any = null;
  let isLoading = true;
  let error = '';
  let debugInfo = '';

  async function loadData() {
    try {
      debugInfo += '🔍 Simple Dashboard: Starting...\n';
      
      if (!browser) {
        debugInfo += '❌ Not in browser, skipping\n';
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('loyaltyUser') || '{}');
      debugInfo += `📱 User: ${JSON.stringify(currentUser)}\n`;
      
      if (!currentUser.mobile) {
        error = 'No user found';
        debugInfo += '❌ No mobile\n';
        return;
      }

      debugInfo += `🔍 Looking for customer: ${currentUser.mobile}\n`;

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', currentUser.mobile)
        .single();

      if (customerError) {
        error = `Error: ${customerError.message}`;
        debugInfo += `❌ Error: ${customerError.message}\n`;
        return;
      }

      debugInfo += `✅ Customer found: ${customer.full_name}\n`;
      customerData = customer;
      error = '';

    } catch (err) {
      debugInfo += `💥 Exception: ${err}\n`;
      error = `Exception: ${err}`;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>Simple Dashboard Test</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-6">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Simple Dashboard Test</h1>
    
    <!-- Debug Section -->
    <div class="bg-white border rounded-lg p-4 mb-6">
      <h3 class="font-bold mb-2">Debug Info:</h3>
      <pre class="text-sm bg-gray-100 p-3 rounded whitespace-pre-wrap">{debugInfo}</pre>
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p>⏳ Loading...</p>
      </div>
    {/if}

    <!-- Error State -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h3 class="font-bold">❌ Error:</h3>
        <p>{error}</p>
      </div>
    {/if}

    <!-- Success State -->
    {#if customerData}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <h3 class="font-bold">✅ Customer Data Loaded:</h3>
        <p><strong>Name:</strong> {customerData.full_name}</p>
        <p><strong>Mobile:</strong> {customerData.customer_code}</p>
        <p><strong>Points:</strong> {customerData.points}</p>
      </div>

      <!-- Simple Dashboard Content -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Welcome, {customerData.full_name}!</h2>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Points Card -->
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Your Points</h3>
            <p class="text-3xl font-bold">{customerData.points || 0}</p>
            <p class="text-sm opacity-90">Total Points Balance</p>
          </div>

          <!-- Customer Info -->
          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Account Info</h3>
            <p class="text-gray-600"><strong>Mobile:</strong> {customerData.customer_code}</p>
            <p class="text-gray-600"><strong>Member Since:</strong> {customerData.created_at ? (() => {
              const date = new Date(customerData.created_at);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            })() : 'N/A'}</p>
          </div>
        </div>
      </div>
    {:else if !isLoading && !error}
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>⚠️ No customer data available (not loading, no error, but customerData is null/undefined)</p>
      </div>
    {/if}

    <div class="mt-6 space-x-2">
      <button 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        on:click={loadData}
      >
        Reload Data
      </button>
      <button 
        class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        on:click={() => window.location.href = '/dashboard'}
      >
        Try Full Dashboard
      </button>
    </div>
  </div>
</div>
