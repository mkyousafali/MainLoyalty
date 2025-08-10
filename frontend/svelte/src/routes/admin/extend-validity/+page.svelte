<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let singleCard = '';
  let singleDate = '';
  let singleMessage = '';

  let bulkDate = '';
  let customers: any[] = [];
  let filtered: any[] = [];
  let selected: string[] = [];
  let search = '';
  let progress = 0;
  let bulkMessage = '';
  let sortBy = 'card_number';
  let sortAsc = true;

  let extendAllDate = '';
  let extendAllProgress = 0;
  let extendAllMessage = '';

  // Load real customer data from Supabase
  onMount(async () => {
    await loadCustomers();
  });

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          card_number,
          full_name,
          valid_until,
          is_active,
          card_types (
            name,
            color
          )
        `)
        .order('card_number');

      if (error) throw error;

      customers = data.map((customer: any) => ({
        id: customer.id.toString(),
        card_number: customer.card_number,
        name: customer.full_name || 'Unknown',
        valid_until: customer.valid_until ? new Date(customer.valid_until).toISOString().split('T')[0] : 'Not set',
        is_active: customer.is_active,
        card_type: customer.card_types?.name || 'Bronze'
      }));
      
      filtered = [...customers];
    } catch (error) {
      console.error('Error loading customers:', error);
      singleMessage = '❌ Error loading customer data';
    }
  }

  $: if (search) {
    filtered = customers.filter((c: any) =>
      c.card_number.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
    );
  } else {
    filtered = [...customers];
  }

  $: filtered.sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  function toggleSelect(id: string) {
    selected = selected.includes(id)
      ? selected.filter(i => i !== id)
      : [...selected, id];
  }

  async function extendSingle() {
    if (!singleCard || !singleDate) {
      singleMessage = '❌ Fill both fields';
      return;
    }

    singleMessage = 'Processing...';
    
    try {
      // Use the stored function to extend card validity
      const { data, error } = await supabase.rpc('extend_card_validity', {
        card_num: singleCard,
        new_expiry_date: new Date(singleDate).toISOString()
      });

      if (error) throw error;

      if (data.success) {
        singleMessage = `✅ Extended card ${singleCard} to ${singleDate}`;
        // Reload customers to show updated data
        await loadCustomers();
        // Clear form
        singleCard = '';
        singleDate = '';
      } else {
        singleMessage = `❌ ${data.message}`;
      }
    } catch (error) {
      console.error('Error extending card validity:', error);
      singleMessage = '❌ Error extending card validity';
    }
  }

  async function extendBulk() {
    if (!bulkDate || selected.length === 0) {
      bulkMessage = '❌ Select customers and date';
      return;
    }

    progress = 0;
    bulkMessage = 'Processing...';

    try {
      // Get selected card numbers
      const selectedCards = customers
        .filter((c: any) => selected.includes(c.id))
        .map((c: any) => c.card_number);

      // Use the stored function to extend multiple cards
      const { data, error } = await supabase.rpc('extend_multiple_cards_validity', {
        card_numbers: selectedCards,
        new_expiry_date: new Date(bulkDate).toISOString()
      });

      if (error) throw error;

      if (data.success) {
        bulkMessage = `✅ Updated ${data.updated_count} customers to expire on ${bulkDate}`;
        // Reload customers to show updated data
        await loadCustomers();
        // Clear selections
        selected = [];
        bulkDate = '';
        progress = 100;
        setTimeout(() => (progress = 0), 2000);
      } else {
        bulkMessage = `❌ ${data.message}`;
      }
    } catch (error) {
      console.error('Error extending bulk validity:', error);
      bulkMessage = '❌ Error extending card validity';
    }
  }

  function sort(col: string) {
    if (sortBy === col) sortAsc = !sortAsc;
    else {
      sortBy = col;
      sortAsc = true;
    }
  }

  async function extendAll() {
    if (!extendAllDate) {
      extendAllMessage = '❌ Select a valid date';
      return;
    }

    extendAllMessage = 'Updating all cards...';
    extendAllProgress = 50;

    try {
      // Use the stored function to extend all cards
      const { data, error } = await supabase.rpc('extend_all_cards_validity', {
        new_expiry_date: new Date(extendAllDate).toISOString()
      });

      if (error) throw error;

      if (data.success) {
        extendAllProgress = 100;
        extendAllMessage = `✅ Extended all ${data.updated_count} cards to ${extendAllDate}`;
        // Reload customers to show updated data
        await loadCustomers();
        // Clear form
        extendAllDate = '';
        setTimeout(() => (extendAllProgress = 0), 3000);
      } else {
        extendAllMessage = `❌ ${data.message}`;
        extendAllProgress = 0;
      }
    } catch (error) {
      console.error('Error extending all card validity:', error);
      extendAllMessage = '❌ Error extending all cards';
      extendAllProgress = 0;
    }
  }
</script>

<div class="p-6 max-w-6xl mx-auto bg-white shadow rounded-xl">
  <h1 class="text-2xl font-bold text-red-600 mb-6">⏳ Extend Validity</h1>

  <!-- Single Card -->
  <div class="mb-10 bg-blue-50 p-5 rounded-lg border border-blue-200">
    <h2 class="text-lg font-semibold text-blue-700 mb-3">📘 Extend Single Card</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input type="text" placeholder="Enter card number" bind:value={singleCard} class="border px-3 py-2 rounded" />
      <input type="date" bind:value={singleDate} class="border px-3 py-2 rounded" />
      <button on:click={extendSingle} class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Extend</button>
    </div>
    {#if singleMessage}
      <p class="mt-3 text-sm font-medium {singleMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}">{singleMessage}</p>
    {/if}
  </div>

  <!-- Table Filter -->
  <div class="flex justify-between items-center mb-2">
    <h2 class="text-lg font-semibold text-gray-800">📋 Registered Customers</h2>
    <input type="text" placeholder="🔍 Search by name or number" bind:value={search} class="border px-3 py-2 rounded w-64" />
  </div>

  <!-- 📋 Scrollable Table -->
  <div class="h-[320px] overflow-y-scroll border border-purple-300 rounded-md shadow-sm mb-6">
    <table class="w-full text-sm text-left border-collapse min-w-[600px]">
      <thead class="sticky top-0 bg-purple-100 text-purple-900">
        <tr>
          <th class="px-3 py-2 border-b border-purple-300">✔️</th>
          <th class="px-3 py-2 border-b border-purple-300 cursor-pointer" on:click={() => sort('card_number')}>
            Card Number {sortBy === 'card_number' ? (sortAsc ? '↑' : '↓') : ''}
          </th>
          <th class="px-3 py-2 border-b border-purple-300 cursor-pointer" on:click={() => sort('name')}>
            Name {sortBy === 'name' ? (sortAsc ? '↑' : '↓') : ''}
          </th>
          <th class="px-3 py-2 border-b border-purple-300 cursor-pointer" on:click={() => sort('valid_until')}>
            Current Expiry {sortBy === 'valid_until' ? (sortAsc ? '↑' : '↓') : ''}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as c}
          <tr class="bg-purple-50 hover:bg-purple-100 text-purple-900 border-b border-purple-200">
            <td class="px-3 py-2">
              <input type="checkbox" checked={selected.includes(c.id)} on:change={() => toggleSelect(c.id)} />
            </td>
            <td class="px-3 py-2 font-mono">{c.card_number}</td>
            <td class="px-3 py-2">{c.name}</td>
            <td class="px-3 py-2">{c.valid_until}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- ⚡ Bulk Extension Box -->
  <div class="bg-yellow-50 p-5 border border-yellow-200 rounded-lg">
    <h3 class="font-semibold text-yellow-800 mb-2">⚡ Bulk Extend</h3>

    <div class="flex flex-wrap gap-4 items-center mb-2">
      <input type="date" bind:value={bulkDate} class="border px-3 py-2 rounded" />
      <button
        on:click={extendBulk}
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
        disabled={!bulkDate || selected.length === 0}
      >
        Extend Selected ({selected.length})
      </button>
    </div>

    <!-- 🔔 Warning if nothing selected -->
    {#if bulkMessage}
      <p class="text-sm font-medium {bulkMessage.includes('✅') ? 'text-green-600' : 'text-red-600'} mb-2">
        {bulkMessage}
      </p>
    {/if}

    <!-- 📊 Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div class="bg-green-500 h-3 rounded-full transition-all duration-300" style="width: {progress}%"></div>
    </div>
    <p class="text-sm text-gray-600 mt-1">
      {progress}% {progress === 0 ? 'Idle' : progress === 100 ? 'Complete' : 'Updating...'}
    </p>
  </div>

  <!-- 🔁 Extend All Registered Customers -->
  <div class="mt-8 bg-yellow-50 p-5 border border-yellow-200 rounded-lg">
    <h3 class="font-semibold text-yellow-800 mb-3">🟡 Extend All Registered Customers</h3>

    <div class="flex flex-wrap gap-4 items-center mb-3">
      <input type="date" bind:value={extendAllDate} class="border px-3 py-2 rounded" />
      <button
        on:click={extendAll}
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:bg-red-300"
        disabled={!extendAllDate}
      >
        Extend All
      </button>
    </div>

    <!-- ✅ or ❌ message -->
    {#if extendAllMessage}
      <p class="text-sm font-medium {extendAllMessage.includes('✅') ? 'text-green-600' : 'text-red-600'} mb-2">
        {extendAllMessage}
      </p>
    {/if}

    <!-- Progress -->
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div class="bg-red-500 h-3 rounded-full transition-all duration-300" style="width: {extendAllProgress}%"></div>
    </div>
    <p class="text-sm text-gray-600 mt-1">
      {extendAllProgress}% {extendAllProgress === 0 ? 'Idle' : extendAllProgress === 100 ? 'Complete' : 'Updating...'}
    </p>
  </div>
</div>
