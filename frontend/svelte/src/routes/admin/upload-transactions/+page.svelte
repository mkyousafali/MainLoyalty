<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { uploadManager } from '$lib/uploadManager';
  import * as XLSX from 'xlsx';

  // ────────────────────────────────────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────────────────────────────────────
  let branches: Array<{ id: string; name_en: string }> = [];
  let selectedBranch = '';

  let isLoading = false;
  let error = '';
  let success = '';

  // Preview + file
  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;
  let previewData: any[] = [];
  let showPreview = false;

  // Upload job / progress
  let uploadJobId = '';
  let uploadProgress = 0; // percentage (from manager helper)
  let showProcessStatus = false;
  let processingMessage = '';
  let queueProgress = { processed: 0, total: 0, failed: 0 };

  // Last upload + recent uploads
  let lastUploadStatus: any = null;
  let recentUploads: any[] = [];
  let showLastUploadStatus = false;

  // Manual entry
  let manualTransaction = {
    bill_no: '',
    bill_date: '',
    bill_amount: '',
    customer: '',
    add_amt: '',
    redeem: ''
  };

  // Upload statistics and errors (for server feedback after completion)
  let uploadStats = { total: 0, successful: 0, errors: 0, invalidCustomers: 0 };
  let uploadErrors: Array<{ row: number; customer: string; error: string }> = [];

  // Unsubscribers for Svelte store subscriptions
  const unsubscribers: Array<() => void> = [];

  // ────────────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────────────────
  onMount(() => {
    loadBranches();

    // Subscribe once to upload manager stores
    if ((uploadManager as any).activeUploadsStore && (uploadManager as any).completedUploadsStore) {
      const unsubA = uploadManager.activeUploadsStore.subscribe((activeMap: Map<string, any>) => {
        const activeArray = Array.from(activeMap.values());
        if (activeArray.length > 0) {
          lastUploadStatus = activeArray[0];
          showLastUploadStatus = true;
        }
        updateRecentUploads(activeArray, null);
      });

      const unsubB = uploadManager.completedUploadsStore.subscribe((completed: any[]) => {
        if ((!lastUploadStatus || lastUploadStatus.status !== 'processing') && completed.length > 0) {
          lastUploadStatus = completed[0];
          showLastUploadStatus = true;
        }
        updateRecentUploads(null, completed);
      });

      unsubscribers.push(unsubA, unsubB);
    } else {
      console.warn('uploadManager stores not found. Ensure activeUploadsStore & completedUploadsStore exist.');
    }
  });

  onDestroy(() => {
    unsubscribers.forEach((u) => u?.());
  });

  // ────────────────────────────────────────────────────────────────────────────────
  // Data loaders
  // ────────────────────────────────────────────────────────────────────────────────
  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('id, name_en')
        .order('name_en');

      if (branchError) throw branchError;
      branches = data || [];
    } catch (err: any) {
      error = `Failed to load branches: ${err.message}`;
    }
  }

  function updateRecentUploads(activeArrayMaybe: any[] | null, completedMaybe: any[] | null) {
    const activeArray = activeArrayMaybe ?? [];
    const completed = completedMaybe ?? [];
    const merged = [
      ...activeArray.map((u) => ({
        id: u.id ?? u.jobId,
        fileName: u.fileName,
        status: u.status,
        progress: u.progress ?? { processed: 0, total: 0, failed: 0 },
        created_at: u.created_at ?? new Date().toISOString(),
        error_msg: u.error ?? u.error_msg ?? null
      })),
      ...completed.slice(0, 5)
    ];

    recentUploads = merged
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────────
  function validateMobile(mobile: string): boolean {
    const cleanMobile = (mobile || '').replace(/\s/g, '');
    return /^5\d{8}$/.test(cleanMobile) || /^05\d{8}$/.test(cleanMobile);
  }

  // IMPORTANT: preview should NOT mutate DB. Use dryRun=true in preview.
  async function validateCustomer(
    mobile: string,
    branchId: string,
    opts: { dryRun?: boolean } = {}
  ): Promise<any> {
    const { dryRun = false } = opts;

    // Normalize dual lookups (05xxxxxxxx vs 5xxxxxxxx)
    let lookupMobile = (mobile || '').trim();
    let altLookupMobile: string | null = null;

    if (lookupMobile.startsWith('05') && lookupMobile.length === 10) {
      altLookupMobile = lookupMobile.substring(1); // 5xxxxxxxx
    } else if (lookupMobile.startsWith('5') && lookupMobile.length === 9) {
      altLookupMobile = '0' + lookupMobile; // 05xxxxxxxx
    }

    // 1) Registered customers by mobile
    let { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id, name, points, total_spent, branch_id, customer_code, mobile')
      .eq('mobile', lookupMobile)
      .maybeSingle();

    if ((!customer || custError) && altLookupMobile) {
      const alt = await supabase
        .from('customers')
        .select('id, name, points, total_spent, branch_id, customer_code, mobile')
        .eq('mobile', altLookupMobile)
        .maybeSingle();
      if (alt.data) customer = alt.data;
    }

    if (customer) return customer;

    // 2) Try by customer_code
    let { data: customerByCode } = await supabase
      .from('customers')
      .select('id, name, points, total_spent, branch_id, customer_code, mobile')
      .eq('customer_code', lookupMobile)
      .maybeSingle();

    if ((!customerByCode) && altLookupMobile) {
      const alt2 = await supabase
        .from('customers')
        .select('id, name, points, total_spent, branch_id, customer_code, mobile')
        .eq('customer_code', altLookupMobile)
        .maybeSingle();
      if (alt2.data) customerByCode = alt2.data;
    }

    if (customerByCode) return customerByCode;

    // 3) Eligibility (customer_numbers)
    let { data: eligible } = await supabase
      .from('customer_numbers')
      .select('customer, status, branch_id')
      .eq('customer', lookupMobile)
      .maybeSingle();

    if ((!eligible) && altLookupMobile) {
      const alt3 = await supabase
        .from('customer_numbers')
        .select('customer, status, branch_id')
        .eq('customer', altLookupMobile)
        .maybeSingle();
      if (alt3.data) eligible = alt3.data;
    }

    if (eligible) {
      if (eligible.status === 'registered') {
        throw new Error('Customer marked registered but not found in customers table');
      }
      return {
        id: null,
        name: `Unregistered Customer ${mobile}`,
        points: 0,
        branch_id: eligible.branch_id,
        customer_code: mobile,
        mobile,
        isUnregistered: true
      };
    }

    // 4) Not found anywhere — if dryRun, DO NOT write. Just return a pseudo-customer.
    if (dryRun) {
      return {
        id: null,
        name: `New Customer ${mobile}`,
        points: 0,
        branch_id: branchId,
        customer_code: mobile,
        mobile,
        isUnregistered: true,
        isNewlyAdded: true
      };
    }

    // Otherwise, auto-add to eligibility list
    const { error: insertError } = await supabase.from('customer_numbers').insert({
      customer: lookupMobile,
      status: 'not_registered',
      branch_id: branchId,
      uploaded_at: new Date().toISOString()
    });
    if (insertError) throw new Error(`Failed to add customer ${mobile} to eligible list: ${insertError.message}`);

    return {
      id: null,
      name: `New Customer ${mobile}`,
      points: 0,
      branch_id: branchId,
      customer_code: mobile,
      mobile,
      isUnregistered: true,
      isNewlyAdded: true
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Manual Transaction
  // ────────────────────────────────────────────────────────────────────────────────
  async function addManualTransaction() {
    try {
      if (!selectedBranch) throw new Error('Please select a branch first');
      if (!validateMobile(manualTransaction.customer))
        throw new Error('Please enter a valid Saudi mobile: 5xxxxxxxx (9) or 05xxxxxxxx (10)');
      if (!manualTransaction.bill_no.trim()) throw new Error('Please enter bill number');
      if (!manualTransaction.bill_date) throw new Error('Please enter bill date');
      if (!manualTransaction.bill_amount || parseFloat(manualTransaction.bill_amount) <= 0)
        throw new Error('Please enter a valid bill amount');

      isLoading = true;
      error = '';

      const customer = await validateCustomer(manualTransaction.customer, selectedBranch);

      const addAmt = parseFloat(manualTransaction.add_amt) || 0;
      const redeemAmt = parseFloat(manualTransaction.redeem) || 0;
      const currentPoints = Number(customer.points || 0);
      const balanceAfter = currentPoints + addAmt - redeemAmt;

      const transactionDateISO = new Date(manualTransaction.bill_date).toISOString();

      const { error: insertError } = await supabase.from('customer_transactions').insert({
        bill_no: manualTransaction.bill_no.trim(),
        bill_date: manualTransaction.bill_date,
        bill_amount: parseFloat(manualTransaction.bill_amount),
        customer_id: customer.isUnregistered ? null : customer.id,
        customer_code: manualTransaction.customer,
        customer_mobile: manualTransaction.customer,
        branch_id: selectedBranch,
        transaction_type: 'purchase',
        amount: parseFloat(manualTransaction.bill_amount),
        points_earned: addAmt,
        points_used: redeemAmt, // standardized
        add_amt: addAmt,
        redeem: redeemAmt,
        balance_after: balanceAfter,
        status: 'completed',
        transaction_date: transactionDateISO,
        processed_at: new Date().toISOString()
      });
      if (insertError) throw insertError;

      // Update customer counters only if registered
      if (!customer.isUnregistered && customer.id) {
        const totalSpent = (Number(customer.total_spent) || 0) + parseFloat(manualTransaction.bill_amount);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ points: balanceAfter, total_spent: totalSpent })
          .eq('id', customer.id);
        if (updateError) throw updateError;
      }

      await logUpload('manual_entry', 1, 1, 0, []);

      success = 'Transaction added successfully!';
      manualTransaction = { bill_no: '', bill_date: '', bill_amount: '', customer: '', add_amt: '', redeem: '' };
    } catch (e: any) {
      error = `Failed to add transaction: ${e.message}`;
    } finally {
      isLoading = false;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Excel: select, preview, validate (read-only), queue upload
  // ────────────────────────────────────────────────────────────────────────────────
  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    selectedFile = file;
    previewExcelFile(file);
  }

  async function previewExcelFile(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      previewData = (jsonData || [])
        .slice(1, 6)
        .map((row: any, index) => {
          let customer = row[3]?.toString().trim() || '';
          let originalCustomer = customer;
          if (customer.length === 9 && customer.startsWith('5')) originalCustomer = '0' + customer;
          else if (customer.startsWith('05') && customer.length === 10) originalCustomer = customer;
          return {
            rowNumber: index + 2,
            bill_no: row[0]?.toString().trim() || '',
            bill_date: row[1]?.toString().trim() || '',
            bill_amount: row[2]?.toString().trim() || '',
            customer: originalCustomer,
            add_amt: row[4]?.toString().trim() || '',
            redeem: row[5]?.toString().trim() || '',
            status: 'Checking...'
          };
        });

      await validatePreviewData();
      showPreview = true;
      error = '';
    } catch (err: any) {
      error = `Failed to preview file: ${err.message}`;
    }
  }

  async function validatePreviewData() {
    if (!selectedBranch || !previewData.length) return;

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      try {
        if (!validateMobile(row.customer)) {
          previewData[i].status = '✗ Invalid Mobile';
          continue;
        }
        const customerRecord = await validateCustomer(row.customer, selectedBranch, { dryRun: true });
        if (customerRecord.isNewlyAdded) previewData[i].status = '✨ Auto-Added (if uploaded)';
        else if (customerRecord.isUnregistered) previewData[i].status = '⏳ Eligible (Not Registered)';
        else previewData[i].status = '✅ Registered Customer';
      } catch (err: any) {
        previewData[i].status = '✗ Not Eligible';
      }
    }
    // trigger reactivity
    previewData = [...previewData];
  }

  async function uploadExcelFile() {
    try {
      if (!selectedFile) throw new Error('Please choose a file');
      if (!selectedBranch) throw new Error('Please select a branch');

      isLoading = true;
      error = '';
      success = '';
      processingMessage = 'Submitting file to upload queue...';

      const jobId = await uploadManager.startUpload(selectedFile, selectedBranch, []);
      uploadJobId = jobId;

      processingMessage = `Upload queued successfully! Job ID: ${jobId}`;
      success = `File uploaded to queue successfully! Job ID: ${jobId}. Processing will continue in the background.`;

      startProgressMonitoring();
      isLoading = false;
    } catch (e: any) {
      isLoading = false;
      error = `Upload failed: ${e?.message || 'Unknown error'}`;
      processingMessage = '';
    }
  }

  function startProgressMonitoring() {
    if (!uploadJobId) return;

    const interval = setInterval(async () => {
      const status = await uploadManager.getUploadStatus(uploadJobId);
      if (status) {
        queueProgress = status.progress ?? { processed: 0, total: 0, failed: 0 };
        uploadProgress = uploadManager.getProgressPercentage(status) ?? 0;

        if (status.status === 'processing') {
          processingMessage = `Processing: ${queueProgress.processed}/${queueProgress.total} transactions`;
          showProcessStatus = true;
        } else if (status.status === 'completed') {
          showProcessStatus = false;
          success = `Upload completed! ${queueProgress.processed} processed, ${queueProgress.failed} failed.`;
          clearInterval(interval);
        } else if (status.status === 'failed') {
          showProcessStatus = false;
          error = `Upload failed: ${status.error_msg || 'Unknown error'}`;
          clearInterval(interval);
        }
      }
    }, 2000);

    // safety stop after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Logging (best-effort)
  // ────────────────────────────────────────────────────────────────────────────────
  async function logUpload(fileName: string, total: number, successful: number, errors: number, errorDetails: any[]) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const { error: logError } = await supabase.from('transaction_upload_logs').insert({
        uploaded_by: currentUser.id || null,
        branch_id: selectedBranch,
        file_name: fileName,
        record_count: total,
        success_count: successful,
        error_count: errors,
        errors: errorDetails,
        uploaded_at: new Date().toISOString()
      });
      if (logError) console.warn('Failed to log upload (optional):', logError);
    } catch (err) {
      console.warn('Failed to log upload:', err);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ────────────────────────────────────────────────────────────────────────────────
  function downloadTemplate() {
    const template = [
      ['Bill No', 'Bill Date (YYYY-MM-DD)', 'Bill Amount', 'Customer Mobile', 'Points to Add', 'Points to Redeem'],
      ['545439', '2025-07-27', '27.9', '0500014006', '0.28', '0'],
      ['555741', '2025-08-04', '284.86', '0500014006', '2.85', '0'],
      ['479569', '2025-05-30', '21.24', '0500019376', '0.11', '0'],
      ['493515', '2025-06-11', '153.02', '0500019376', '1.53', '0'],
      ['497543', '2025-06-15', '94.39', '0500019376', '0.94', '0'],
      ['', '', '', '', '', ''],
      ['INSTRUCTIONS:', '', '', '', '', ''],
      ['• Bill No: Unique invoice/receipt number', '', '', '', '', ''],
      ['• Bill Date: Format YYYY-MM-DD (e.g. 2025-08-07)', '', '', '', '', ''],
      ['• Bill Amount: Total purchase amount in ﷼', '', '', '', '', ''],
      ['• Customer Mobile: 5xxxxxxxx (9) or 05xxxxxxxx (10)', '', '', '', '', ''],
      ['• Points to Add: Points earned from this transaction', '', '', '', '', ''],
      ['• Points to Redeem: Points used in this transaction', '', '', '', '', ''],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    (ws as any)['!cols'] = [
      { width: 15 },
      { width: 20 },
      { width: 14 },
      { width: 18 },
      { width: 16 },
      { width: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Template');
    XLSX.writeFile(wb, 'urban_market_transactions_template.xlsx');
  }

  function clearAll() {
    selectedFile = null;
    previewData = [];
    showPreview = false;
    uploadStats = { total: 0, successful: 0, errors: 0, invalidCustomers: 0 };
    uploadErrors = [];
    error = '';
    success = '';
    uploadProgress = 0;
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="max-w-6xl mx-auto">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Upload Transactions</h1>
    <p class="text-gray-600">Add customer transactions manually or upload from Excel with automatic points calculation.</p>
  </div>

  <!-- Last Upload Status -->
  {#if showLastUploadStatus && lastUploadStatus}
    <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100 relative">
      <div class="absolute -left-1 top-6 w-1 h-10 rounded bg-gradient-to-b from-blue-500 to-blue-300"></div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <span class="text-2xl">{uploadManager.getStatusIcon(lastUploadStatus.status)}</span>
          Last Upload Status
        </h2>
        <div class="flex gap-3">
          <a href="/admin/upload-status" class="text-blue-600 hover:text-blue-700 text-sm font-medium">Upload Dashboard →</a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-600">File Name</p>
          <p class="font-medium break-all">{lastUploadStatus.fileName}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Status</p>
          <p class="font-medium" class:status-chip-processing={lastUploadStatus.status==='processing'} class:status-chip-completed={lastUploadStatus.status==='completed'} class:status-chip-failed={lastUploadStatus.status==='failed'} class:status-chip-paused={lastUploadStatus.status==='paused'}>
            {lastUploadStatus.status.toUpperCase()}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Progress</p>
          <p class="font-medium">
            {lastUploadStatus.progress.processed} / {lastUploadStatus.progress.total}
            {#if lastUploadStatus.progress.failed > 0}
              <span class="text-red-600">({lastUploadStatus.progress.failed} failed)</span>
            {/if}
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{uploadManager.getProgressPercentage(lastUploadStatus)}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div class="h-2 rounded-full transition-all duration-300"
               class:bg-blue-500={lastUploadStatus.status==='processing'}
               class:bg-green-500={lastUploadStatus.status==='completed'}
               class:bg-red-500={lastUploadStatus.status==='failed'}
               class:bg-orange-500={lastUploadStatus.status==='paused'}
               class:bg-yellow-500={lastUploadStatus.status==='queued'}
               style={`width: ${uploadManager.getProgressPercentage(lastUploadStatus)}%`}>
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      {#if lastUploadStatus.status === 'processing'}
        <div class="flex gap-2 mb-3">
          <button on:click={() => uploadManager.pauseUpload(lastUploadStatus.id)} class="btn-warning">⏸️ Pause</button>
          <button on:click={() => uploadManager.cancelUpload(lastUploadStatus.id)} class="btn-danger">🚫 Cancel</button>
        </div>
      {:else if lastUploadStatus.status === 'paused'}
        <div class="flex gap-2 mb-3">
          <button on:click={() => uploadManager.resumeUpload(lastUploadStatus.id)} class="btn-success">▶️ Resume</button>
          <button on:click={() => uploadManager.cancelUpload(lastUploadStatus.id)} class="btn-danger">🚫 Cancel</button>
        </div>
      {/if}

      <!-- Timestamps -->
      <div class="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Started: {new Date(lastUploadStatus.created_at).toLocaleString()}</span>
        {#if lastUploadStatus.started_at}<span>Processing: {new Date(lastUploadStatus.started_at).toLocaleString()}</span>{/if}
        {#if lastUploadStatus.completed_at}<span>Completed: {new Date(lastUploadStatus.completed_at).toLocaleString()}</span>{/if}
      </div>

      {#if lastUploadStatus.error_msg}
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-700">{lastUploadStatus.error_msg}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Job Management quick links -->
  <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Job Management</h2>
        <p class="text-sm text-gray-600">Monitor and manage all upload operations</p>
      </div>
      <div class="flex gap-3">
        <a href="/admin/upload-jobs" class="btn-primary-outline">📋 View All Job Details</a>
        <a href="/admin/upload-status" class="btn-link">Upload Dashboard →</a>
      </div>
    </div>
  </div>

  <!-- Recent Uploads -->
  {#if recentUploads.length > 0}
    <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Recent Uploads</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">File</th>
              <th class="th">Status</th>
              <th class="th">Progress</th>
              <th class="th">Time</th>
              <th class="th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each recentUploads as upload}
              <tr class="hover:bg-gray-50">
                <td class="td">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{uploadManager.getStatusIcon(upload.status)}</span>
                    <span class="font-medium break-all">{upload.fileName}</span>
                  </div>
                </td>
                <td class="td">
                  <span class="chip" class:chip-success={upload.status==='completed'} class:chip-danger={upload.status==='failed'} class:chip-info={upload.status==='processing'} class:chip-warn={upload.status==='paused' || upload.status==='queued'}>
                    {upload.status.toUpperCase()}
                  </span>
                </td>
                <td class="td">
                  <div class="flex items-center gap-2">
                    <div class="w-20 bg-gray-200 rounded-full h-1.5">
                      <div class="h-1.5 rounded-full" class:bg-green-500={upload.status==='completed'} class:bg-red-500={upload.status==='failed'} class:bg-blue-500={upload.status==='processing'} class:bg-yellow-500={upload.status==='paused' || upload.status==='queued'} style={`width: ${uploadManager.getProgressPercentage(upload)}%`}></div>
                    </div>
                    <span class="text-xs">{upload.progress?.processed ?? 0}/{upload.progress?.total ?? 0}</span>
                  </div>
                </td>
                <td class="td text-gray-600">{new Date(upload.created_at).toLocaleString()}</td>
                <td class="td">
                  {#if upload.status === 'processing'}
                    <div class="flex gap-1">
                      <button on:click={() => uploadManager.pauseUpload(upload.id)} class="icon-btn warn" title="Pause Upload">⏸️</button>
                      <button on:click={() => uploadManager.cancelUpload(upload.id)} class="icon-btn danger" title="Cancel Upload">🚫</button>
                    </div>
                  {:else if upload.status === 'paused'}
                    <div class="flex gap-1">
                      <button on:click={() => uploadManager.resumeUpload(upload.id)} class="icon-btn success" title="Resume Upload">▶️</button>
                      <button on:click={() => uploadManager.cancelUpload(upload.id)} class="icon-btn danger" title="Cancel Upload">🚫</button>
                    </div>
                  {:else}
                    <span class="text-gray-400 text-xs">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Branch Selection -->
  <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
    <h2 class="text-lg font-semibold mb-4">Select Branch</h2>
    <select bind:value={selectedBranch} class="select" required>
      <option value="">Choose a branch...</option>
      {#each branches as branch}
        <option value={branch.id}>{branch.name_en}</option>
      {/each}
    </select>
  </div>

  <!-- Manual Entry -->
  <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
    <h2 class="text-lg font-semibold mb-4">Manual Transaction Entry</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      <div>
        <label class="label">Bill Number</label>
        <input type="text" bind:value={manualTransaction.bill_no} placeholder="INV001" class="input" />
      </div>
      <div>
        <label class="label">Bill Date</label>
        <input type="date" bind:value={manualTransaction.bill_date} class="input" />
      </div>
      <div>
        <label class="label">Bill Amount (﷼)</label>
        <input type="number" step="0.01" bind:value={manualTransaction.bill_amount} placeholder="100.50" class="input" />
      </div>
      <div>
        <label class="label">Customer Mobile</label>
        <input type="text" bind:value={manualTransaction.customer} placeholder="5xxxxxxxx or 05xxxxxxxx" maxlength="10" class="input" />
      </div>
      <div>
        <label class="label">Points to Add</label>
        <input type="number" bind:value={manualTransaction.add_amt} placeholder="10" class="input" />
      </div>
      <div>
        <label class="label">Points to Redeem</label>
        <input type="number" bind:value={manualTransaction.redeem} placeholder="0" class="input" />
      </div>
    </div>

    <button on:click={addManualTransaction} disabled={isLoading || !selectedBranch} class="btn-primary">
      {isLoading ? 'Adding...' : 'Add Transaction'}
    </button>
  </div>

  <!-- Excel Upload -->
  <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">Excel File Upload</h2>
      <button on:click={downloadTemplate} class="btn-success-outline text-sm flex items-center gap-2">
        <span>📥</span>
        Download Template
      </button>
    </div>

    <div class="mb-4">
      <label class="label">Choose Excel File</label>
      <input type="file" bind:this={fileInput} on:change={handleFileSelect} accept=".xlsx,.xls" class="file-input" />
      <p class="text-sm text-gray-500 mt-1">Columns: Bill No, Bill Date (YYYY-MM-DD), Bill Amount, Customer Mobile, Points to Add, Points to Redeem</p>
    </div>

    {#if showPreview}
      <div class="mb-4">
        <h3 class="font-medium mb-2">File Preview (First 5 rows)</h3>
        <div class="overflow-x-auto border rounded-lg">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="th-xs">Row</th>
                <th class="th-xs">Bill No</th>
                <th class="th-xs">Date</th>
                <th class="th-xs">Amount</th>
                <th class="th-xs">Customer</th>
                <th class="th-xs">Add</th>
                <th class="th-xs">Redeem</th>
                <th class="th-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {#each previewData as row}
                <tr class="border-t">
                  <td class="td-xs">{row.rowNumber}</td>
                  <td class="td-xs">{row.bill_no}</td>
                  <td class="td-xs">{row.bill_date}</td>
                  <td class="td-xs">{row.bill_amount}</td>
                  <td class="td-xs font-mono">{row.customer}</td>
                  <td class="td-xs">{row.add_amt}</td>
                  <td class="td-xs">{row.redeem}</td>
                  <td class="td-xs">
                    <span class="status-text" class:text-green-600={row.status.includes('✅')} class:text-yellow-600={row.status.includes('⏳')} class:text-purple-600={row.status.includes('✨')} class:text-red-600={row.status.includes('✗')} class:text-blue-600={row.status.includes('Checking')}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <div class="flex gap-4">
      <button on:click={uploadExcelFile} disabled={isLoading || !selectedFile || !selectedBranch} class="btn-primary">
        {isLoading ? 'Uploading...' : 'Upload Excel File'}
      </button>
      <button on:click={clearAll} class="btn-secondary">Clear All</button>
    </div>

    {#if showProcessStatus}
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">{processingMessage}</span>
          <span>{uploadProgress}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="h-2 rounded-full bg-blue-500 transition-all duration-300" style={`width: ${uploadProgress}%`}></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Upload Statistics (optional server summary) -->
  {#if uploadStats.total > 0}
    <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
      <h2 class="text-lg font-semibold mb-4">Upload Statistics</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card text-blue-600 bg-blue-50">{uploadStats.total}<span>Total Records</span></div>
        <div class="stat-card text-green-600 bg-green-50">{uploadStats.successful}<span>Successful</span></div>
        <div class="stat-card text-yellow-600 bg-yellow-50">{uploadStats.invalidCustomers}<span>Invalid Customers</span></div>
        <div class="stat-card text-red-600 bg-red-50">{uploadStats.errors}<span>Other Errors</span></div>
      </div>
    </div>
  {/if}

  <!-- Error Details -->
  {#if uploadErrors.length > 0}
    <div class="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
      <h2 class="text-lg font-semibold mb-4 text-red-600">Upload Errors</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-red-50">
            <tr>
              <th class="th">Row</th>
              <th class="th">Customer</th>
              <th class="th">Error</th>
            </tr>
          </thead>
          <tbody>
            {#each uploadErrors as err}
              <tr class="border-t">
                <td class="td">{err.row}</td>
                <td class="td font-mono">{err.customer}</td>
                <td class="td text-red-600">{err.error}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Messages -->
  {#if error}
    <div class="alert error">{error}</div>
  {/if}
  {#if success}
    <div class="alert success">{success}</div>
  {/if}
</div>

<style>
  /* Small, tasteful style helpers on top of Tailwind */
  .label { @apply block text-sm font-medium text-gray-700 mb-2; }
  .input { @apply w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
  .select { @apply w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
  .file-input { @apply w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }

  .btn-primary { @apply bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed; }
  .btn-secondary { @apply bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700; }
  .btn-primary-outline { @apply bg-blue-600/10 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-600/20 font-medium; }
  .btn-success-outline { @apply border border-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50; }
  .btn-link { @apply text-blue-600 hover:text-blue-700 font-medium px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50; }

  .btn-danger { @apply px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors; }
  .btn-warning { @apply px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors; }
  .btn-success { @apply px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors; }

  .icon-btn { @apply px-2 py-1 rounded text-xs text-white; }
  .icon-btn.warn { @apply bg-orange-500 hover:bg-orange-600; }
  .icon-btn.danger { @apply bg-red-500 hover:bg-red-600; }
  .icon-btn.success { @apply bg-green-500 hover:bg-green-600; }

  .th { @apply px-3 py-2 text-left font-medium text-gray-700; }
  .td { @apply px-3 py-2; }

  .th-xs { @apply px-3 py-2 text-left text-xs font-medium text-gray-700; }
  .td-xs { @apply px-3 py-2 text-xs; }

  .chip { @apply px-2 py-1 text-xs rounded-full; }
  .chip-success { @apply bg-green-100 text-green-800; }
  .chip-danger { @apply bg-red-100 text-red-800; }
  .chip-info { @apply bg-blue-100 text-blue-800; }
  .chip-warn { @apply bg-yellow-100 text-yellow-800; }

  .status-chip-processing { @apply text-blue-700; }
  .status-chip-completed { @apply text-green-700; }
  .status-chip-failed { @apply text-red-700; }
  .status-chip-paused { @apply text-orange-700; }

  .stat-card { @apply text-center p-4 rounded-lg font-bold; }
  .stat-card span { @apply block mt-1 text-xs font-normal text-gray-600; }

  .alert { @apply px-4 py-3 rounded mb-4 border; }
  .alert.error { @apply bg-red-50 border-red-200 text-red-700; }
  .alert.success { @apply bg-green-50 border-green-200 text-green-700; }
</style>
