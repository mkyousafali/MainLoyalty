<script lang="ts">
  // Mocked data (will connect to Supabase later)
  let whatsappLink = 'https://wa.me/9744733432';

  let branches = [
    {
      name: 'Al Malqa',
      website: 'https://urbanmarket.com/malqa',
      instagram: 'https://instagram.com/urbanmalqa',
      offer_pdf_url: ''
    },
    {
      name: 'Al Rabwa',
      website: '',
      instagram: '',
      offer_pdf_url: ''
    }
  ];

  function saveGlobalLink() {
    // TODO: Connect to Supabase
    alert('Global WhatsApp link saved!');
  }

  function saveBranch(index: number) {
    // TODO: Connect to Supabase
    alert(`${branches[index].name} settings saved!`);
  }

  function handleFileUpload(event: Event, index: number) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // TODO: Upload to Supabase storage
      console.log(`Uploading ${file.name} for ${branches[index].name}`);
      alert(`File ${file.name} ready to upload for ${branches[index].name}`);
    }
  }
</script>

<div class="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-red-600 mb-2 text-center">⚙️ Support Link Settings</h1>
    <p class="text-gray-600 text-center text-sm">
      Manage WhatsApp support links and branch contact information
    </p>
  </div>

  <!-- Global WhatsApp Section -->
  <div class="mb-10 p-6 bg-green-50 rounded-xl border border-green-200">
    <h2 class="text-lg font-semibold text-green-800 mb-4">💬 Global WhatsApp Support</h2>
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">WhatsApp Support Link</label>
      <input
        type="text"
        bind:value={whatsappLink}
        class="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        placeholder="https://wa.me/XXXXXXXXXXX"
      />
      <p class="text-xs text-gray-500">
        This link will be used across the entire application for customer support
      </p>
      <button 
        on:click={saveGlobalLink}
        class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
      >
        💾 Save Global Link
      </button>
    </div>
  </div>

  <!-- Branch-Wise Settings -->
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-700 mb-2">📍 Branch Settings</h2>
    <p class="text-sm text-gray-600 mb-4">
      Configure individual branch contact information and promotional materials
    </p>
  </div>

  <div class="grid md:grid-cols-2 gap-6">
    {#each branches as branch, index}
      <div class="bg-gray-50 p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🏪</span>
          <h3 class="text-red-600 font-bold text-lg">{branch.name}</h3>
        </div>

        <div class="space-y-4">
          <!-- Website Input -->
          <div>
            <label class="text-sm block mb-2 font-medium text-gray-700 flex items-center gap-1">
              🌐 Website URL
            </label>
            <input
              class="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              bind:value={branch.website}
              placeholder="https://example.com"
            />
          </div>

          <!-- Instagram Input -->
          <div>
            <label class="text-sm block mb-2 font-medium text-gray-700 flex items-center gap-1">
              📸 Instagram URL
            </label>
            <input
              class="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              bind:value={branch.instagram}
              placeholder="https://instagram.com/username"
            />
          </div>

          <!-- File Upload -->
          <div>
            <label class="text-sm block mb-2 font-medium text-gray-700 flex items-center gap-1">
              📄 Upload Offer PDF
            </label>
            <input 
              type="file" 
              accept=".pdf"
              on:change={(e) => handleFileUpload(e, index)}
              class="w-full border border-gray-300 px-3 py-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
              💡 PDF will be accessible from the customer support page
            </p>
          </div>

          <!-- Current PDF Status -->
          {#if branch.offer_pdf_url}
            <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p class="text-sm text-blue-800 font-medium">📎 Current PDF:</p>
              <a href={branch.offer_pdf_url} target="_blank" class="text-blue-600 hover:underline text-sm">
                View Current PDF
              </a>
            </div>
          {:else}
            <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="text-sm text-yellow-800">⚠️ No PDF uploaded yet</p>
            </div>
          {/if}

          <!-- Save Button -->
          <button 
            on:click={() => saveBranch(index)}
            class="bg-blue-600 text-white w-full py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            💾 Save {branch.name} Settings
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Footer Info -->
  <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 class="font-semibold text-blue-800 mb-2">ℹ️ Admin Notes</h3>
    <ul class="text-sm text-blue-700 space-y-1">
      <li>• Changes will be reflected immediately on the customer support page</li>
      <li>• PDF files should be under 5MB for optimal loading</li>
      <li>• WhatsApp links should follow the format: https://wa.me/[country code][phone number]</li>
      <li>• All fields are optional except the global WhatsApp link</li>
    </ul>
  </div>
</div>
