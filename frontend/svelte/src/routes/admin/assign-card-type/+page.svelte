<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let customers: any[] = [];
  let cardTypes: any[] = [];
  let selectedCardType = '';
  let selectedCustomers = new Set<string>();
  let searchTerm = '';
  let message = '';
  let singleCardNumber = '';
  let loading = false;
  let messageTimeout: NodeJS.Timeout | null = null;

  onMount(async () => {
    await loadData();
  });

  function setMessage(msg: string, autoDismiss = true) {
    message = msg;
    
    // Clear existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    // Auto-dismiss success messages after 5 seconds
    if (autoDismiss && msg.includes('✅')) {
      messageTimeout = setTimeout(() => {
        message = '';
      }, 5000);
    }
  }

  async function loadData() {
    loading = true;
    await loadCardTypes();
    await loadCustomers();
    loading = false;
  }

  async function loadCardTypes() {
    try {
      const { data, error } = await supabase
        .from('card_types')
        .select('id, name, color, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error loading card types:', error);
        message = `❌ Failed to load card types: ${error.message}`;
        cardTypes = [];
        return;
      }
      
      cardTypes = data || [];
      console.log('✅ Card types loaded:', cardTypes); // Debug log
      console.log('🔍 First card type ID type:', typeof cardTypes[0]?.id, 'Value:', cardTypes[0]?.id); // Debug log
    } catch (error: any) {
      console.error('Error loading card types:', error);
      message = `❌ Error loading card types: ${error?.message || 'Unknown error'}`;
      cardTypes = [];
    }
  }

  async function loadCustomers() {
    try {
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count', { count: 'exact', head: true });
        
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        message = `❌ Database connection failed: ${testError.message}`;
        return;
      }
      
      // Load customers using the correct field names from the actual schema
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id, card_number, customer_code, full_name, mobile, phone, email, address, place, 
          nearest_branch_id, card_type_id, total_points, points_earned_total, points_redeemed_total, 
          is_active, valid_until, registration_date, created_at, updated_at,
          card_types (id, name, color)
        `)
        .order('full_name')
        .limit(500);
      
      if (error) {
        console.error('Error loading customers:', error);
        message = `❌ Failed to load customers: ${error.message}`;
        customers = [];
        return;
      }
      
      if (!data || data.length === 0) {
        message = '⚠️ No customers found in database';
        customers = [];
        return;
      }
      
      customers = data.map(customer => ({
        ...customer,
        // Map schema fields to our expected format for display
        name: customer.full_name || 'Unknown Customer',
        first_name: customer.full_name?.split(' ')[0] || '',
        last_name: customer.full_name?.split(' ').slice(1).join(' ') || '',
        expiry_date: customer.valid_until || customer.created_at
      }));
      
      setMessage(`✅ Loaded ${customers.length} customers successfully`);
    } catch (error: any) {
      console.error('💥 Exception loading customers:', error);
      message = `❌ Error loading customers: ${error?.message || 'Unknown error'}`;
      customers = [];
    }
  }

  function clearSearch() {
    searchTerm = '';
  }

  function toggleCustomerSelection(id: string) {
    if (selectedCustomers.has(id)) {
      selectedCustomers.delete(id);
    } else {
      selectedCustomers.add(id);
    }
    selectedCustomers = new Set(selectedCustomers);
  }

  function toggleSelectAll() {
    const filtered = filteredCustomers;
    const allSelected = filtered.every(c => selectedCustomers.has(c.id));
    
    if (allSelected) {
      filtered.forEach(c => selectedCustomers.delete(c.id));
    } else {
      filtered.forEach(c => selectedCustomers.add(c.id));
    }
    selectedCustomers = new Set(selectedCustomers);
  }

  async function assignToOne() {
    if (!singleCardNumber || !selectedCardType) {
      message = '❌ Please enter card number and select card type';
      return;
    }

    try {
      // First check if customer exists (using correct schema fields)
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('id, full_name, card_number')
        .eq('card_number', singleCardNumber)
        .eq('is_active', true)
        .single();

      if (findError || !existingCustomer) {
        message = `❌ Customer with card number "${singleCardNumber}" not found. Check the card number and try again.`;
        console.error('Customer not found:', findError);
        return;
      }

      // Update the customer's card type (ensure we're using correct ID type)
      console.log('🔍 DEBUG ASSIGNMENT:');
      console.log('  selectedCardType type:', typeof selectedCardType, 'value:', selectedCardType);
      console.log('  existingCustomer.id type:', typeof existingCustomer.id, 'value:', existingCustomer.id);
      console.log('  Available card types:', cardTypes.map(ct => ({ id: ct.id, type: typeof ct.id })));
      
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          card_type_id: selectedCardType, // Use as string/UUID directly
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        message = `❌ Failed to assign card type: ${error.message}`;
        return;
      }
      
      const customerName = existingCustomer.full_name || 'Unknown Customer';
      const cardTypeName = cardTypes.find(ct => ct.id == selectedCardType)?.name || 'Unknown';
      setMessage(`✅ Assigned ${cardTypeName} to ${customerName} (${singleCardNumber})`);
      
      // Reload customers to show updated card type
      await loadCustomers();
      singleCardNumber = '';
      selectedCardType = '';
    } catch (error: any) {
      console.error('Error assigning card type:', error);
      message = `❌ Error: ${error?.message || 'Unknown error'}`;
    }
  }

  async function assignToAll() {
    if (!selectedCardType) {
      message = '❌ Please select a card type';
      return;
    }

    try {
      // Get count of active customers first
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (!count || count === 0) {
        message = '❌ No active customers found';
        return;
      }

      // Update all active customers
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          card_type_id: selectedCardType, // Use as string/UUID directly
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .select('id');

      if (error) {
        console.error('Update error:', error);
        message = `❌ Failed to assign card type: ${error.message}`;
        return;
      }
      
      const cardTypeName = cardTypes.find(ct => ct.id == selectedCardType)?.name || 'Unknown';
      const updatedCount = data?.length || 0;
      setMessage(`✅ Assigned ${cardTypeName} to ${updatedCount} customers successfully`);
      
      await loadCustomers();
      selectedCardType = '';
    } catch (error: any) {
      console.error('Error assigning card type to all:', error);
      message = `❌ Error: ${error?.message || 'Unknown error'}`;
    }
  }

  async function assignBulk() {
    if (!selectedCardType || selectedCustomers.size === 0) {
      message = '❌ Please select card type and customers';
      return;
    }

    try {
      const customerIds = Array.from(selectedCustomers); // Keep as strings/UUIDs
      
      // Update selected customers
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          card_type_id: selectedCardType, // Use as string/UUID directly
          updated_at: new Date().toISOString()
        })
        .in('id', customerIds)
        .select('id, full_name');

      if (error) {
        console.error('Bulk update error:', error);
        message = `❌ Failed to assign card type: ${error.message}`;
        return;
      }
      
      const cardTypeName = cardTypes.find(ct => ct.id == selectedCardType)?.name || 'Unknown';
      const updatedCount = data?.length || 0;
      setMessage(`✅ Successfully assigned ${cardTypeName} to ${updatedCount} customer(s)`);
      
      selectedCustomers = new Set();
      await loadCustomers();
      selectedCardType = '';
    } catch (error: any) {
      console.error('Error in bulk assignment:', error);
      message = `❌ Error: ${error?.message || 'Unknown error'}`;
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  }

  function getCardTypeName(cardTypeId: string | number | null) {
    if (!cardTypeId) return 'Unassigned';
    return cardTypes.find(ct => ct.id == cardTypeId)?.name || 'Unassigned';
  }

  function getCardTypeColor(cardTypeId: string | number | null) {
    if (!cardTypeId) return '#6b7280';
    return cardTypes.find(ct => ct.id == cardTypeId)?.color || '#6b7280';
  }

  $: filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.card_number.includes(searchTerm) ||
    getCardTypeName(c.card_type_id).toLowerCase().includes(searchTerm.toLowerCase())
  );
</script>

<div class="p-6 space-y-6 max-w-7xl mx-auto">
  <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-2">
    📌 Card Type Assignment Management
  </h1>

  {#if loading}
    <div class="text-center py-12">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 text-lg">Loading data...</p>
    </div>
  {:else}
    <!-- Single Assignment Section -->
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h2 class="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
        🧍 Single Customer Assignment
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div class="space-y-2">
          <label for="cardNumber" class="block text-sm font-medium text-gray-700">
            Card Number
          </label>
          <div class="relative">
            <input 
              id="cardNumber"
              placeholder="Enter full card number" 
              bind:value={singleCardNumber} 
              class="input w-full pl-10" 
              aria-label="Customer card number"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">💳</span>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <label for="cardType" class="block text-sm font-medium text-gray-700">
            Card Type
          </label>
          <select 
            id="cardType"
            bind:value={selectedCardType} 
            class="select w-full"
            aria-label="Select card type"
          >
            <option value="">Choose card type...</option>
            {#each cardTypes as ct}
              <option value={ct.id}>{ct.name}</option>
            {/each}
          </select>
        </div>
        <button 
          on:click={assignToOne} 
          class="btn bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
          disabled={!singleCardNumber || !selectedCardType}
          aria-label="Assign card type to single customer"
        >
          ✅ Assign
        </button>
      </div>
    </div>

    <!-- Bulk Assignment to All Customers Section -->
    <div class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100">
      <h2 class="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
        👥 Bulk Assignment to All Customers
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div class="space-y-2">
          <label for="bulkCardType" class="block text-sm font-medium text-gray-700">
            Card Type for All Customers
          </label>
          <select 
            id="bulkCardType"
            bind:value={selectedCardType} 
            class="select w-full"
            aria-label="Select card type for all customers"
          >
            <option value="">Choose card type...</option>
            {#each cardTypes as ct}
              <option value={ct.id}>{ct.name}</option>
            {/each}
          </select>
        </div>
        <button 
          on:click={assignToAll} 
          class="btn bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          disabled={!selectedCardType}
          aria-label="Assign card type to all customers"
        >
          🚀 Assign to All
        </button>
      </div>
    </div>

    <!-- Table-based Selection Section -->
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h2 class="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
        📋 Table-based Customer Selection
      </h2>
      
      <!-- Search Bar -->
      <div class="mb-6 flex gap-3">
        <div class="relative flex-1">
          <input 
            placeholder="Search by name, card number, or card type..." 
            bind:value={searchTerm} 
            class="input w-full pl-10 pr-10" 
            aria-label="Search customers"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400">🔍</span>
          </div>
          {#if searchTerm}
            <button 
              on:click={clearSearch}
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          {/if}
        </div>
      </div>

      <!-- Results Info -->
      <div class="mb-4 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          Showing <span class="font-medium">{filteredCustomers.length}</span> of <span class="font-medium">{customers.length}</span> customers
        </div>
        {#if selectedCustomers.size > 0}
          <div class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            {selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected
          </div>
        {/if}
      </div>

      <!-- Customer Table -->
      <div class="overflow-x-auto border rounded-lg">
        <table class="w-full table-auto">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-4 text-left">
                <input 
                  type="checkbox" 
                  on:change={toggleSelectAll}
                  checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomers.has(c.id))}
                  class="rounded focus:ring-2 focus:ring-purple-500"
                  aria-label="Select all customers"
                />
              </th>
              <th class="p-4 text-left font-semibold text-gray-700">👤 Name</th>
              <th class="p-4 text-left font-semibold text-gray-700">💳 Card Number</th>
              <th class="p-4 text-left font-semibold text-gray-700">🏷️ Card Type</th>
              <th class="p-4 text-left font-semibold text-gray-700">📅 Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredCustomers as c}
              <tr class="border-t hover:bg-gray-100 transition-colors duration-150"
                  class:bg-purple-50={selectedCustomers.has(c.id)}
                  class:border-purple-200={selectedCustomers.has(c.id)}>
                <td class="p-4">
                  <input 
                    type="checkbox" 
                    checked={selectedCustomers.has(c.id)} 
                    on:change={() => toggleCustomerSelection(c.id)}
                    class="rounded focus:ring-2 focus:ring-purple-500"
                    aria-label="Select customer {c.name}"
                  />
                </td>
                <td class="p-4 font-medium text-gray-900">{c.name}</td>
                <td class="p-4 font-mono text-gray-600">{c.card_number}</td>
                <td class="p-4">
                  <span 
                    class="px-3 py-1 rounded-full text-sm font-semibold text-white flex items-center gap-1 inline-flex"
                    style="background-color: {getCardTypeColor(c.card_type_id)}"
                  >
                    {#if getCardTypeName(c.card_type_id).toLowerCase().includes('premium')}
                      👑
                    {:else if getCardTypeName(c.card_type_id).toLowerCase().includes('gold')}
                      ⭐
                    {:else if getCardTypeName(c.card_type_id).toLowerCase().includes('silver')}
                      🥈
                    {:else}
                      🏷️
                    {/if}
                    {getCardTypeName(c.card_type_id)}
                  </span>
                </td>
                <td class="p-4 text-gray-600">{formatDate(c.expiry_date)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if filteredCustomers.length === 0}
          <div class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-2">🔍</div>
            <p class="text-lg font-medium">No customers found</p>
            <p class="text-sm">Try adjusting your search criteria</p>
          </div>
        {/if}
      </div>

      <!-- Bulk Assignment Controls -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Assign Card Type to Selected Customers</h3>
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px] space-y-2">
            <label for="bulkSelectCardType" class="block text-sm font-medium text-gray-700">
              Card Type
            </label>
            <select 
              id="bulkSelectCardType"
              bind:value={selectedCardType} 
              class="select w-full"
              aria-label="Select card type for selected customers"
            >
              <option value="">Choose card type...</option>
              {#each cardTypes as ct}
                <option value={ct.id}>{ct.name}</option>
              {/each}
            </select>
          </div>
          <button 
            on:click={assignBulk} 
            class="btn bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
            disabled={selectedCustomers.size === 0 || !selectedCardType}
            aria-label="Assign card type to selected customers"
          >
            📋 Assign to Selected ({selectedCustomers.size})
          </button>
        </div>
      </div>
    </div>

    <!-- Status Message -->
    {#if message}
      <div class="p-4 rounded-xl shadow-md flex items-center justify-between"
           class:bg-green-100={message.includes('✅')}
           class:text-green-700={message.includes('✅')}
           class:border-green-200={message.includes('✅')}
           class:bg-red-100={!message.includes('✅')}
           class:text-red-700={!message.includes('✅')}
           class:border-red-200={!message.includes('✅')}
           class:border={true}>
        <div class="flex items-center gap-2">
          <span class="text-lg">
            {#if message.includes('✅')}
              ✔️
            {:else}
              ❌
            {/if}
          </span>
          <p class="font-medium">{message}</p>
        </div>
        <button 
          on:click={() => message = ''}
          class="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Close message"
        >
          ✕
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .input {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    transition: all 0.2s ease;
    background-color: white;
  }
  .input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }
  .input:hover {
    border-color: #9ca3af;
  }
  
  .select {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  .select:hover {
    border-color: #9ca3af;
  }
  
  .btn {
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 44px; /* Better tap target for mobile */
  }
  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .btn-secondary {
    background-color: #6b7280;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 44px;
  }
  .btn-secondary:hover {
    background-color: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .btn-secondary:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .btn, .btn-secondary {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .input, .select {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
</style>
