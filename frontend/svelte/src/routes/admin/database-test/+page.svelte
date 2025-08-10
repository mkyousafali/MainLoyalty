<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let testResults: any[] = [];
  let errors: string[] = [];
  let isLoading = true;
  let connectionStatus = 'Testing...';

  onMount(async () => {
    await testConnection();
    await testAllTables();
    isLoading = false;
  });

  async function testConnection() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        connectionStatus = 'Connection Error';
        errors.push(`Connection: ${error.message}`);
      } else {
        connectionStatus = 'Connected Successfully';
      }
    } catch (err: any) {
      connectionStatus = 'Connection Failed';
      errors.push(`Connection: ${err.message}`);
    }
  }

  async function testAllTables() {
    const tables = [
      'roles',
      'branches', 
      'users',
      'customer_numbers',
      'card_types',
      'customers',
      'transactions',
      'coupons',
      'coupon_usage',
      'reward_categories',
      'rewards',
      'gifts',
      'notifications'
    ];

    testResults = [];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          errors.push(`${table}: ${error.message}`);
          testResults.push({ table, count: 0, status: 'ERROR', error: error.message });
        } else {
          testResults.push({ table, count: count || 0, status: 'OK' });
        }
      } catch (err: any) {
        errors.push(`${table}: ${err.message}`);
        testResults.push({ table, count: 0, status: 'ERROR', error: err.message });
      }
    }
  }

  async function retestConnection() {
    isLoading = true;
    errors = [];
    testResults = [];
    connectionStatus = 'Testing...';
    
    await testConnection();
    await testAllTables();
    isLoading = false;
  }
</script>

<div class="p-6">
  <div class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Database Connection Test</h1>
          <p class="text-gray-600">Test database connectivity and table accessibility.</p>
        </div>
        <button
          on:click={retestConnection}
          disabled={isLoading}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Retest Connection'}
        </button>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Connection Status</h2>
        <div class="flex items-center space-x-3">
          {#if isLoading}
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          {:else if connectionStatus.includes('Success')}
            <span class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </span>
          {:else}
            <span class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </span>
          {/if}
          <span class="text-lg font-medium">{connectionStatus}</span>
        </div>
      </div>
    </div>

    <!-- Tables Status -->
    <div class="mb-6">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold">Tables Status</h2>
          <p class="text-sm text-gray-600 mt-1">Status of all database tables</p>
        </div>
        
        {#if isLoading}
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Testing database tables...</p>
          </div>
        {:else if testResults.length === 0}
          <div class="p-8 text-center text-gray-500">
            No table results available. Click "Retest Connection" to try again.
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Count</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each testResults as result}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if result.status === 'OK'}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                          OK
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                          </svg>
                          ERROR
                        </span>
                      {/if}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.table}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.count.toLocaleString()} records
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {#if result.status === 'OK'}
                        <span class="text-green-600">Accessible</span>
                      {:else}
                        <span class="text-red-600">{result.error || 'Unknown error'}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- Summary Statistics -->
    {#if !isLoading && testResults.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-2xl text-green-600 mr-4">✅</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Successful Tables</p>
              <p class="text-2xl font-bold text-gray-900">
                {testResults.filter(r => r.status === 'OK').length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-2xl text-red-600 mr-4">❌</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Failed Tables</p>
              <p class="text-2xl font-bold text-gray-900">
                {testResults.filter(r => r.status === 'ERROR').length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-2xl text-blue-600 mr-4">📊</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Total Records</p>
              <p class="text-2xl font-bold text-gray-900">
                {testResults.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Errors Section -->
    {#if errors.length > 0}
      <div class="mb-6">
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-red-600">Errors Detected</h2>
            <p class="text-sm text-gray-600 mt-1">{errors.length} error(s) found during testing</p>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              {#each errors as error}
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <code class="text-red-800 text-sm">{error}</code>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Database Info -->
    <div class="bg-gray-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">Database Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Database Type:</span>
          <span class="text-gray-600 ml-2">Supabase PostgreSQL</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Connection Method:</span>
          <span class="text-gray-600 ml-2">Supabase Client</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Test Date:</span>
          <span class="text-gray-600 ml-2">{new Date().toLocaleString()}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Tables Tested:</span>
          <span class="text-gray-600 ml-2">{testResults.length} tables</span>
        </div>
      </div>
    </div>
  </div>
</div>
