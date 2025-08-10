<script lang="ts">
  let selectedPeriod = '3months';
  let customDate = '';

  const periods = [
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: 'custom', label: 'Custom Date' }
  ];

  function extendAllCards() {
    // TODO: Connect to Supabase
    if (selectedPeriod === 'custom' && !customDate) {
      alert('Please select a custom date');
      return;
    }
    const period = selectedPeriod === 'custom' ? customDate : selectedPeriod;
    alert(`Extending all loyalty cards by ${period}`);
  }

  function extendSpecificCard() {
    // TODO: Connect to Supabase
    alert('Feature to extend specific cards will be implemented');
  }
</script>

<div class="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-red-600 mb-2 text-center">⏰ Extend Card Validity</h1>
    <p class="text-gray-600 text-center text-sm">
      Manage loyalty card expiration dates
    </p>
  </div>

  <!-- Bulk Extension Section -->
  <div class="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
    <h2 class="text-lg font-semibold text-purple-800 mb-4">🎯 Bulk Extension</h2>
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Extension Period</label>
      <select
        bind:value={selectedPeriod}
        class="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      >
        {#each periods as period}
          <option value={period.value}>{period.label}</option>
        {/each}
      </select>

      {#if selectedPeriod === 'custom'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Custom Expiry Date</label>
          <input
            type="date"
            bind:value={customDate}
            class="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      {/if}

      <button
        on:click={extendAllCards}
        class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
      >
        ⏰ Extend All Cards
      </button>
    </div>
  </div>

  <!-- Individual Card Extension -->
  <div class="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
    <h2 class="text-lg font-semibold text-yellow-800 mb-4">🎯 Individual Card Extension</h2>
    <div class="space-y-4">
      <p class="text-sm text-gray-600">
        Extend validity for specific customers based on mobile number or other criteria
      </p>
      <button
        on:click={extendSpecificCard}
        class="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md"
      >
        🎯 Configure Individual Extensions
      </button>
    </div>
  </div>

  <!-- Current Status -->
  <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 class="font-semibold text-blue-800 mb-2">ℹ️ Current System Status</h3>
    <ul class="text-sm text-blue-700 space-y-1">
      <li>• Total active cards: 1,247</li>
      <li>• Cards expiring in 30 days: 89</li>
      <li>• Cards expiring in 90 days: 234</li>
      <li>• Last bulk extension: Never</li>
    </ul>
  </div>
</div>
