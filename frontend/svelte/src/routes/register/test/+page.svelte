<script>
  let customer = {
    name: '',
    preferred_branch: ''
  };
  let branches = ['Main Branch', 'City Center', 'Green Hills'];
  let error = '';

  function createCard() {
    error = '';
    if (!customer.name || !customer.preferred_branch) {
      error = '❌ Please fill all fields.';
      return;
    }
    alert(`✅ Card created for ${customer.name} at ${customer.preferred_branch}`);
  }
</script>

<div class="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-md p-6">
  <h2 class="text-2xl font-semibold mb-6 text-center">🪪 Register Your Card</h2>

  {#if error}
    <div class="text-red-600 bg-red-100 p-3 rounded mb-4">{error}</div>
  {/if}

  <div class="mb-4">
    <label class="block font-medium mb-1">Full Name</label>
    <input
      class="w-full border px-3 py-2 rounded"
      type="text"
      bind:value={customer.name}
      placeholder="Enter your name"
    />
  </div>

  <div class="mb-6">
    <label class="block font-medium mb-1">Preferred Branch</label>
    <select
      class="w-full border px-3 py-2 rounded"
      bind:value={customer.preferred_branch}
    >
      <option value="">-- Select Branch --</option>
      {#each branches as b}
        <option value={b}>{b}</option>
      {/each}
    </select>
  </div>

  <button
    class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
    on:click={createCard}
  >
    ✅ Create My Card
  </button>
</div>
