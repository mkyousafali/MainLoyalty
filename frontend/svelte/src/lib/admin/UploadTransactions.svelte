<script lang="ts">
  let transactionFile: File | null = null;

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      transactionFile = file;
      console.log('Transaction CSV file selected:', file.name);
    }
  }

  function uploadTransactions() {
    if (!transactionFile) {
      alert('Please select a CSV file first');
      return;
    }
    // TODO: Process CSV and upload to Supabase
    alert(`Uploading ${transactionFile.name} transactions to database`);
  }
</script>

<div class="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-red-600 mb-2 text-center">💳 Upload Transactions</h1>
    <p class="text-gray-600 text-center text-sm">
      Bulk upload transaction history via CSV file
    </p>
  </div>

  <!-- File Upload Section -->
  <div class="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
    <h2 class="text-lg font-semibold text-green-800 mb-4">📄 Transaction CSV Upload</h2>
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Select CSV File</label>
      <input
        type="file"
        accept=".csv"
        on:change={handleFileUpload}
        class="w-full border border-gray-300 px-3 py-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />
      <p class="text-xs text-gray-500">
        CSV should contain columns: mobile, branch, amount, points, date, status
      </p>
      <button
        on:click={uploadTransactions}
        class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
      >
        📤 Upload Transactions
      </button>
    </div>
  </div>

  <!-- CSV Format Example -->
  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
    <h3 class="font-semibold text-gray-800 mb-2">📋 Expected CSV Format</h3>
    <pre class="text-sm text-gray-600 bg-white p-3 rounded border font-mono">
mobile,branch,amount,points,date,status
0551234567,Al Malqa,85.50,8,2025-07-15,Completed
0559876543,Al Rabwa,45.00,4,2025-07-14,Completed
0557654321,Al Zahra,120.75,12,2025-07-13,Completed
    </pre>
  </div>
</div>
