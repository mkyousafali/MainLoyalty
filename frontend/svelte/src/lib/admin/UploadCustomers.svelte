<script lang="ts">
  let customers = [];
  let csvFile: File | null = null;

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      csvFile = file;
      console.log('CSV file selected:', file.name);
    }
  }

  function uploadCustomers() {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }
    // TODO: Process CSV and upload to Supabase
    alert(`Uploading ${csvFile.name} customers to database`);
  }
</script>

<div class="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-red-600 mb-2 text-center">👥 Upload Customers</h1>
    <p class="text-gray-600 text-center text-sm">
      Bulk upload customer data via CSV file
    </p>
  </div>

  <!-- File Upload Section -->
  <div class="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
    <h2 class="text-lg font-semibold text-blue-800 mb-4">📄 CSV File Upload</h2>
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Select CSV File</label>
      <input
        type="file"
        accept=".csv"
        on:change={handleFileUpload}
        class="w-full border border-gray-300 px-3 py-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p class="text-xs text-gray-500">
        CSV should contain columns: mobile, name, card_type, total_points
      </p>
      <button
        on:click={uploadCustomers}
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
      >
        📤 Upload Customers
      </button>
    </div>
  </div>

  <!-- CSV Format Example -->
  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
    <h3 class="font-semibold text-gray-800 mb-2">📋 Expected CSV Format</h3>
    <pre class="text-sm text-gray-600 bg-white p-3 rounded border font-mono">
mobile,name,card_type,total_points
0551234567,Ahmed Al-Saeed,Gold,120
0559876543,Fatima Al-Zahra,Silver,85
0557654321,Mohammed Ali,Bronze,45
    </pre>
  </div>
</div>
